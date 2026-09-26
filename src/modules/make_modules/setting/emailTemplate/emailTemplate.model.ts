import { Schema, model } from "mongoose";
import { TEmailTemplate } from "./emailTemplate.interface";

const itemSchema = new Schema(
  {
    cc: { type: String, default: "" },
    bcc: { type: String, default: "" },
    subject: { type: String, default: "" },
    body: { type: String, default: "" },
    pdf_file_name: { type: String, default: "" },
  },
  { _id: false }
);

const emailTemplateSchema = new Schema<TEmailTemplate>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "User",
    },
    settings: {
      from: { type: String, default: "" },
      font_style: { type: String, default: "Arial" },
      font_size: { type: String, default: "14" },
      send_copy_to_salesperson: { type: String, default: "Do not send" },
    },
    templates: {
      invoice: { type: itemSchema, default: {} },
      proforma_invoice: { type: itemSchema, default: {} },
      estimate: { type: itemSchema, default: {} },
      sales_receipt: { type: itemSchema, default: {} },
      delivery_challan: { type: itemSchema, default: {} },
      credit_note: { type: itemSchema, default: {} },
      payment_received: { type: itemSchema, default: {} },
      purchase_order: { type: itemSchema, default: {} },
      bill: { type: itemSchema, default: {} },
      debit_note: { type: itemSchema, default: {} },
      expense: { type: itemSchema, default: {} },
      payment_made: { type: itemSchema, default: {} },
      statement: { type: itemSchema, default: {} },
      payment_reminder: { type: itemSchema, default: {} },
    },
    signature: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

export const EmailTemplateModel = model<TEmailTemplate>("EmailTemplate", emailTemplateSchema);
