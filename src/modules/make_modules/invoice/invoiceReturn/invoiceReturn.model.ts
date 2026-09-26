import { Schema, model, Types } from "mongoose";
import { TInvoiceReturn, returnReasons } from "./invoiceReturn.interface";

const invoiceReturnItemSchema = new Schema(
  {
    product_id: { type: Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    rate: { type: Number },
    amount: { type: Number },
  },
  { _id: false }
);

const invoiceReturnSchema = new Schema<TInvoiceReturn>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    invoice_id: { type: Schema.Types.ObjectId, ref: "Invoice", required: true },
    warehouse_id: { type: Schema.Types.ObjectId, ref: "Warehouse" },
    return_date: { type: Date, required: true },
    return_reason: { type: String, enum: returnReasons, required: true },
    notes: { type: String },
    status: { type: String, default: "Returned" },
    credit_note_id: { type: Schema.Types.ObjectId, ref: "CreditNote" },
    isDeleted: { type: Boolean, default: false },
    isArchive: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const InvoiceReturnModel = model<TInvoiceReturn>(
  "InvoiceReturn",
  invoiceReturnSchema
);
