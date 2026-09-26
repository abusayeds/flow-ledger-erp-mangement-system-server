import { Types } from "mongoose";

export interface TEmailTemplateItem {
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
  pdf_file_name?: string;
}

export interface TEmailTemplateSettings {
  from?: string;
  font_style?: string;
  font_size?: string;
  send_copy_to_salesperson?: string;
}

// Document types that have their own email template (Laravel Email Templates sidebar).
export const emailTemplateTypes = [
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
  "payment_made",
  "statement",
  "payment_reminder",
] as const;

export type TEmailTemplateType = (typeof emailTemplateTypes)[number];

export interface TEmailTemplate {
  _id?: string;
  user_id?: Types.ObjectId;
  settings?: TEmailTemplateSettings;
  templates?: Partial<Record<TEmailTemplateType, TEmailTemplateItem>>;
  signature?: string;
}
