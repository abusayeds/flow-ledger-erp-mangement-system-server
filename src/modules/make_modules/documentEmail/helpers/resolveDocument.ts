import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import { IUser } from "../../../basic_modules/user/user.interface";
import { PaymentModel } from "../../addPayment/payment.model";
import { getDocConfig, isSalesDoc } from "../../pdf.generator/pdf.data";
import { pdfTypes } from "../../pdf.setting/pdf.setting.interface";
import {
  documentEmailPdfTypeMap,
  documentEmailTypes,
  TDocumentEmailType,
  TResolvedDocument,
} from "../documentEmail.interface";

export const asType = (raw: string | undefined): TDocumentEmailType => {
  if (!raw || !(documentEmailTypes as readonly string[]).includes(raw)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Invalid type. Allowed: ${documentEmailTypes.join(", ")}`,
    );
  }
  return raw as TDocumentEmailType;
};

const partyFromDoc = (doc: Record<string, any>, partyKey: "customer_id" | "vendor_id") => {
  const party = doc?.[partyKey];
  if (!party || typeof party !== "object") {
    return { name: null as string | null, email: null as string | null };
  }
  const bp = party.businessProfile || {};
  return {
    name: (bp.companyName || party.name || null) as string | null,
    email: (party.email || null) as string | null,
  };
};

const resolvePaymentForEmail = async (
  id: string,
  user: IUser,
): Promise<{ type: TDocumentEmailType; pdfType: string; document: TResolvedDocument }> => {
  const doc: any = await PaymentModel.findOne({
    _id: id,
    user_id: user._id,
    isDeleted: false,
  })
    .populate("customer_id")
    .lean();

  if (!doc) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }

  const partyInfo = partyFromDoc(doc, "customer_id");
  const companyName =
    (user as any)?.businessProfile?.companyName || user?.name || null;

  return {
    type: "payment_received",
    pdfType: pdfTypes.Payment_Received,
    document: {
      _id: String(doc._id),
      number: doc.payment_number || String(doc._id).slice(-8).toUpperCase(),
      status: null,
      total: doc.amount ?? null,
      date: doc.payment_date ?? null,
      due_date: null,
      currency: (user as any)?.currency || null,
      party_name: partyInfo.name || doc.customer_id?.name || null,
      party_email: partyInfo.email || doc.customer_id?.email || null,
      company_name: companyName,
      raw: doc,
    },
  };
};

/** Load live document for prepare/send (scoped to company user). */
export const resolveDocumentForEmail = async (
  typeRaw: string,
  id: string,
  user: IUser,
): Promise<{ type: TDocumentEmailType; pdfType: string; document: TResolvedDocument }> => {
  const type = asType(typeRaw);
  if (!id) throw new AppError(httpStatus.BAD_REQUEST, "id is required");

  // Payment receipt uses PaymentModel (not PaymentReceived / invoice-style).
  if (type === "payment_received") {
    return resolvePaymentForEmail(id, user);
  }

  const pdfType = documentEmailPdfTypeMap[type];
  if (!isSalesDoc(pdfType)) {
    throw new AppError(httpStatus.BAD_REQUEST, `PDF/document type not supported: ${type}`);
  }

  const cfg = getDocConfig(pdfType);
  if (!cfg) {
    throw new AppError(httpStatus.BAD_REQUEST, `Unsupported document type: ${pdfType}`);
  }

  const doc: any = await cfg.model
    .findOne({ _id: id, user_id: user._id, isDeleted: false })
    .populate(cfg.party)
    .lean();

  if (!doc) {
    throw new AppError(httpStatus.NOT_FOUND, "Document not found");
  }

  const partyInfo = partyFromDoc(doc, cfg.party);
  const companyName =
    (user as any)?.businessProfile?.companyName || user?.name || null;

  return {
    type,
    pdfType,
    document: {
      _id: String(doc._id),
      number: doc.invoice_number ?? null,
      status: doc.status ?? null,
      total: doc.total ?? null,
      date: doc.date ?? null,
      due_date: doc.due_date ?? null,
      currency: doc.currency ?? null,
      party_name: partyInfo.name,
      party_email: partyInfo.email,
      company_name: companyName,
      raw: doc,
    },
  };
};

export const getDocumentModel = (pdfType: string) => {
  if (pdfType === pdfTypes.Payment_Received || pdfType === "Payment_Received") {
    return PaymentModel;
  }
  const cfg = getDocConfig(pdfType);
  if (!cfg) throw new AppError(httpStatus.BAD_REQUEST, `Unsupported document type: ${pdfType}`);
  return cfg.model;
};
