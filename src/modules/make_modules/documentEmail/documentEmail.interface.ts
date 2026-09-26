import { TEmailTemplateType } from "../setting/emailTemplate/emailTemplate.interface";

/** Email document types supported by prepare/send APIs. */
export const documentEmailTypes = [
  "invoice",
  "proforma_invoice",
  "estimate",
  "sales_receipt",
  "delivery_challan",
  "credit_note",
  "payment_received",
  "purchase_order",
  "bill",
  "debit_note",
  "expense",
] as const;

export type TDocumentEmailType = (typeof documentEmailTypes)[number];

/** Maps API type → PDF generator type (pdfTypes / DOC_CONFIG key). */
export const documentEmailPdfTypeMap: Record<TDocumentEmailType, string> = {
  invoice: "Invoice",
  proforma_invoice: "Proforma_Invoice",
  estimate: "Estimate",
  sales_receipt: "Sales_Receipt",
  delivery_challan: "Delivery_Challan",
  credit_note: "Credit_Note",
  payment_received: "Payment_Received",
  purchase_order: "Purchase_Order",
  bill: "Bill",
  debit_note: "Debit_Note",
  expense: "Expense",
};

/** Maps API type → email template key (same names). */
export const documentEmailTemplateKey = (type: TDocumentEmailType): TEmailTemplateType =>
  type as TEmailTemplateType;

export type TDocumentEmailPayload = {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  /** Display name only — SMTP From address stays fixed Gmail. */
  from?: string;
  subject: string;
  body: string;
};

export type TDocumentEmailSendBody = {
  type: TDocumentEmailType;
  id: string;
  email: TDocumentEmailPayload;
  attach_pdf?: boolean;
  /** Required — frontend decides which fields to update after send. */
  document_update: Record<string, unknown>;
};

export type TResolvedDocument = {
  _id: string;
  number: string | null;
  status: string | null;
  total: number | null;
  date: Date | string | null;
  due_date: Date | string | null;
  currency: string | null;
  party_name: string | null;
  party_email: string | null;
  company_name: string | null;
  raw: Record<string, unknown>;
};
