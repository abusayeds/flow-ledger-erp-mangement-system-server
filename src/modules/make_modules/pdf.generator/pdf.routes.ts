/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Response } from "express";
import { PassThrough } from "stream";
import { PDFDocument as PDFLibDocument } from "pdf-lib";
import { PDFSettingModel } from "../pdf.setting/pdf.setting.model";
import { generateInvoicePDF } from "./Invoicepdf";
import { generateInvoiceThermalPDF } from "./invoice.thermal.pdf";
import AppError from "../../../errors/AppError";
import { pdfTypes } from "../pdf.setting/pdf.setting.interface";
import { generatePaymentMoodPDF } from "./payment.made.pdf";
import { resolvePaymentMadeData } from "./payment.made.data";
import { generatePaymentReceiptPDF } from "./payment.received.pdf";
import { resolvePaymentReceiptData } from "./payment.receipt.data";
import { generateStatementPDF } from "./statement.pdf";
import { resolveStatementData, StatementOpts } from "./statement.data";
import { authMiddleware, AuthRequest } from "../../../middlewares/auth";
import { role } from "../../../utils/role";
import { IUser } from "../../basic_modules/user/user.interface";
import { resolveSalesDoc, isSalesDoc, getSalesDocTypes, getDocConfig } from "./pdf.data";
import { PaymentModel } from "../addPayment/payment.model";
import { VendorPaymentModel } from "../account/vendorPayment/vendorPayment.model";
import sendResponse from "../../../utils/sendResponse";
import httpStatus from "http-status";

const router = express.Router();

// The two payment types use their own (non invoice-style) layouts but render
// live data: Payment_Received ← PaymentModel, Payment_Made ← VendorPaymentModel.
const PAYMENT_TYPES = [
  { type: pdfTypes.Payment_Received, title: "PAYMENT RECEIPT" },
  { type: pdfTypes.Payment_Made, title: "PAYMENT MADE" },
].map((t) => ({ ...t, dataSource: "live" as const }));

// Account statement for one customer/vendor. `id` is the contact id and the
// optional `from`/`to` body fields bound the period.
const STATEMENT_TYPE = {
  type: pdfTypes.Statement,
  title: "STATEMENT",
  dataSource: "live" as const,
};

/**
 * Render a document PDF.
 *  - `type` → pdfTypes enum value
 *  - `id`   → document id; omitted/not-found → blank "N/A" PDF
 * Layout/visibility come from the company's PDF setting (defaults when none exists).
 */
const renderPdf = async (
  type: string,
  id: string | undefined,
  user: IUser,
  res: Response,
  opts: StatementOpts = {},
) => {
  const settings = (await PDFSettingModel.findOne({ pdfType: type, user_id: user._id }).lean()) || {};

  if (type === pdfTypes.Statement) {
    // id = contact (customer/vendor) id; opts carries the period.
    const data = await resolveStatementData(id, user, opts);
    return await generateStatementPDF(data, settings, res);
  }

  if (isSalesDoc(type)) {
    const data = await resolveSalesDoc(type, id, user);
    // Thermal (80mm roll) variant — same data, receipt-format renderer.
    if (opts.thermal) return await generateInvoiceThermalPDF(data, settings, res);
    return await generateInvoicePDF(data, settings, res);
  }

  // Distinct (non invoice-style) layouts. Purchase_Order / Expense are now
  // invoice-style and handled by isSalesDoc above.
  switch (type) {
    case pdfTypes.Payment_Received: {
      // Live data: PaymentModel via resolvePaymentReceiptData (receipt layout).
      const data = await resolvePaymentReceiptData(id, user);
      return await generatePaymentReceiptPDF(data, settings, res);
    }
    case pdfTypes.Payment_Made: {
      // Live data: VendorPaymentModel via resolvePaymentMadeData.
      const data = await resolvePaymentMadeData(id, user);
      return await generatePaymentMoodPDF(data, settings, res);
    }
    default:
      throw new AppError(400, "Invalid or unsupported PDF type");
  }
};

/** Render one document into a Buffer (same renderPdf, piped to memory instead of res). */
const renderPdfToBuffer = (
  type: string,
  id: string,
  user: IUser,
  opts: StatementOpts = {},
): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const stream = new PassThrough();
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
    // Generators only call res.setHeader() and pipe — a PassThrough with a no-op setHeader is enough.
    const fakeRes = Object.assign(stream, { setHeader: () => fakeRes });
    renderPdf(type, id, user, fakeRes as unknown as Response, opts).catch(reject);
  });

/** "INVOICE" → "Invoice", "SALES RECEIPT" → "Sales Receipt" — label for the download filename. */
const typeLabel = (type: string): string => {
  const known = [...PAYMENT_TYPES, STATEMENT_TYPE].find((t) => t.type === type);
  const title = known?.title || getDocConfig(type)?.title || type.split("_").join(" ");
  return title
    .toLowerCase()
    .replace(/(^|\s)\w/g, (ch: string) => ch.toUpperCase());
};

/** Document numbers (invoice_number / payment_number) for the filename, in the ids' order. */
const docNumbersFor = async (type: string, ids: string[], user: IUser): Promise<string[]> => {
  try {
    let docs: any[] = [];
    if (type === pdfTypes.Payment_Received) {
      docs = await PaymentModel.find({ _id: { $in: ids }, user_id: user._id })
        .select("payment_number").lean();
    } else if (type === pdfTypes.Payment_Made) {
      docs = await VendorPaymentModel.find({ _id: { $in: ids }, user_id: user._id })
        .select("payment_number").lean();
    } else if (isSalesDoc(type)) {
      docs = await getDocConfig(type)!.model.find({ _id: { $in: ids }, user_id: user._id })
        .select("invoice_number").lean();
    }
    const byId = new Map(docs.map((d: any) => [String(d._id), d.invoice_number || d.payment_number]));
    return ids.map((id) => byId.get(id)).filter(Boolean) as string[];
  } catch (_err) {
    return [];
  }
};

/** e.g. "Invoice# INV-0001, INV-0002.pdf" — mirrors the Moon Invoice download name. */
const buildPdfFilename = async (type: string, ids: string[], user: IUser): Promise<string> => {
  const label = typeLabel(type);
  const numbers = await docNumbersFor(type, ids, user);
  const name = numbers.length ? `${label}# ${numbers.join(", ")}` : label;
  return `${name.replace(/[\\/:*?"<>|]/g, "-")}.pdf`;
};

const sendPdfBuffer = (res: Response, bytes: Uint8Array | Buffer, filename: string) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.end(Buffer.from(bytes));
};

/** One or more ids → each document rendered on its own page(s), merged into one PDF. */
const renderMergedPdf = async (
  type: string,
  ids: string[],
  user: IUser,
  res: Response,
  opts: StatementOpts = {},
) => {
  const merged = await PDFLibDocument.create();
  for (const id of ids) {
    const buffer = await renderPdfToBuffer(type, id, user, opts);
    const part = await PDFLibDocument.load(buffer);
    const pages = await merged.copyPages(part, part.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  const bytes = await merged.save();
  sendPdfBuffer(res, bytes, await buildPdfFilename(type, ids, user));
};

/** `ids` body field: array, comma-separated string, or single id string. */
const parseIds = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.map((v) => String(v).trim()).filter(Boolean);
  if (typeof raw === "string") return raw.split(",").map((v) => v.trim()).filter(Boolean);
  return [];
};

const handler = async (req: AuthRequest, res: Response) => {
  const user = req?.user as IUser;
  try {
    const type = (req.body.type || req.body.pdfType) as string;
    if (!type) throw new AppError(400, "type is required");

    // Statement period (ignored by every other type). `variant: "thermal"`
    // (or thermal:true) switches sales docs to the 80mm roll renderer.
    const opts: StatementOpts = {
      from: req.body.from,
      to: req.body.to,
      thermal: req.body.variant === "thermal" || req.body.thermal === true,
    };

    const ids = parseIds(req.body.ids ?? req.params.ids ?? req.body.id);
    if (ids.length > 0) {
      // Single id → one-page PDF; N ids → N documents, each on its own page —
      // downloaded as one file named like "Invoice# INV-0001, INV-0002.pdf".
      return await renderMergedPdf(type, ids, user, res, opts);
    }

    await renderPdf(type, undefined, user, res, opts);
  } catch (err: any) {
    console.error("PDF generation error:", err);
    if (!res.headersSent) {
      res.status(err?.statusCode || 500).json({
        success: false,
        message: "PDF generation failed",
        details: err?.message,
      });
    }
  }
};

// Statement transactions as JSON (opening balance + rows + total), so the app
// can export the statement to CSV / TSV / XLS. Same data the Statement PDF is
// built from (resolveStatementData). Body: { id | contactId, from?, to? }.
const statementData = async (req: AuthRequest, res: Response) => {
  const user = req?.user as IUser;
  const id = (req.body.id ?? req.body.contactId) as string | undefined;
  const opts: StatementOpts = { from: req.body.from, to: req.body.to };
  const data = await resolveStatementData(id, user, opts);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Statement data retrieved successfully.",
    data,
  });
};

// List the document types that can currently generate a PDF (derived from code).
const listTypes = async (_req: AuthRequest, res: Response) => {
  const data = [...getSalesDocTypes(), ...PAYMENT_TYPES, STATEMENT_TYPE];
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Supported PDF types retrieved successfully.",
    data,
  });
};

router.get("/types", authMiddleware(role.company), listTypes);
router.post("/statement-data", authMiddleware(role.company), statementData);
// Unified endpoint: { "type": "Invoice", "id": "<docId>" } or { "ids": [...] }
router.post("/generate", authMiddleware(role.company), handler);
// Back-compat: { "pdfType": "Invoice", "id": "<docId>" }
router.post("/invoice", authMiddleware(role.company), handler);

export const PDFRoutes = router;

/**
 * Public (no-auth) document view — the target of the QR code on a document PDF.
 * Path: /:tenant/:docSlug/:number  (e.g. /<user_id>/invoice/16)
 *  - `tenant`  → the document's user_id (what it's stored under)
 *  - `docSlug` → the pdfType lower-kebab ("invoice", "credit-note", …)
 *  - `number`  → the human invoice_number (falls back to the raw ObjectId)
 * Renders the exact same PDF as POST /pdf/generate. Unknown paths fall through
 * to the app's 404 handler so this never shadows a real route.
 */
const publicDoc = async (
  req: express.Request,
  res: Response,
  next: express.NextFunction,
) => {
  try {
    const { tenant, docSlug, number } = req.params;
    const wanted = String(docSlug || "").toLowerCase();
    const type = getSalesDocTypes()
      .map((t) => t.type)
      .find((t) => t.toLowerCase().replace(/_/g, "-") === wanted);
    if (!type) return next(); // not a document slug → 404

    const cfg = getDocConfig(type)!;
    const human = decodeURIComponent(String(number));
    let doc: any = await cfg.model
      .findOne({ user_id: tenant, invoice_number: human, isDeleted: false })
      .select("_id")
      .lean()
      .catch(() => null);
    // Fallback: the QR may carry the raw ObjectId when a doc has no human number.
    if (!doc && /^[a-f0-9]{24}$/i.test(human)) {
      doc = await cfg.model
        .findOne({ _id: human, user_id: tenant, isDeleted: false })
        .select("_id")
        .lean()
        .catch(() => null);
    }
    if (!doc) return next(); // unknown document → 404

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${typeLabel(type)}-${human}.pdf"`,
    );
    // renderPdf only reads user._id (settings + ownership scope).
    await renderPdf(type, String(doc._id), { _id: tenant } as unknown as IUser, res);
  } catch (err) {
    next(err);
  }
};

const publicRouter = express.Router();
publicRouter.get("/:tenant/:docSlug/:number", publicDoc);
export const PublicPdfRoutes = publicRouter;
