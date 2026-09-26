import { PassThrough } from "stream";
import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import { IUser } from "../../../basic_modules/user/user.interface";
import { PDFSettingModel } from "../../pdf.setting/pdf.setting.model";
import { generateInvoicePDF } from "../../pdf.generator/Invoicepdf";
import { generatePaymentReceiptPDF } from "../../pdf.generator/payment.received.pdf";
import { resolvePaymentReceiptData } from "../../pdf.generator/payment.receipt.data";
import { isSalesDoc, resolveSalesDoc } from "../../pdf.generator/pdf.data";
import { pdfTypes } from "../../pdf.setting/pdf.setting.interface";

type FakeRes = PassThrough & {
  setHeader: (name: string, value: string) => void;
  headersSent: boolean;
};

const createFakeRes = (): { stream: FakeRes; done: Promise<Buffer> } => {
  const stream = new PassThrough() as FakeRes;
  stream.setHeader = () => undefined;
  stream.headersSent = false;

  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    stream.on("data", (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });

  return { stream, done };
};

/** Generate document PDF as Buffer (same engine as /api/v1/pdf/generate). */
export const generateDocumentPdfBuffer = async (
  pdfType: string,
  id: string,
  user: IUser,
): Promise<Buffer> => {
  const settings =
    (await PDFSettingModel.findOne({ pdfType, user_id: user._id }).lean()) || {};
  const { stream, done } = createFakeRes();

  if (pdfType === pdfTypes.Payment_Received || pdfType === "Payment_Received") {
    const data = await resolvePaymentReceiptData(id, user);
    await generatePaymentReceiptPDF(data, settings, stream);
    return done;
  }

  if (!isSalesDoc(pdfType)) {
    throw new AppError(httpStatus.BAD_REQUEST, `PDF type not supported for email: ${pdfType}`);
  }

  const data = await resolveSalesDoc(pdfType, id, user);
  if (!data) {
    throw new AppError(httpStatus.BAD_REQUEST, "Failed to resolve PDF data");
  }

  await generateInvoicePDF(data, settings, stream);
  return done;
};
