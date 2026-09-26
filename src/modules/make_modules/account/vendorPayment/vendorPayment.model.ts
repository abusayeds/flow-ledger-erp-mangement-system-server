import { Schema, model } from "mongoose";
import { paymentStatuses } from "../customerPayment/customerPayment.interface";
import { TVendorPayment } from "./vendorPayment.interface";

const allocationSchema = new Schema(
  {
    invoice_id: { type: Schema.Types.ObjectId, ref: "PurchaseInvoice", required: true },
    allocated_amount: { type: Number, required: true, min: 0.01 },
  },
  { _id: true }
);

const debitNoteAppSchema = new Schema(
  {
    debit_note_id: { type: Schema.Types.ObjectId, ref: "DebitNote", required: true },
    applied_amount: { type: Number, required: true, min: 0.01 },
  },
  { _id: true }
);

const schema = new Schema<TVendorPayment>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    creator_id: { type: Schema.Types.ObjectId, ref: "User" },
    payment_number: { type: String },
    payment_date: { type: Date, required: true },
    vendor_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bank_account_id: { type: Schema.Types.ObjectId, ref: "AccountBankAccount" },
    reference_number: { type: String, trim: true },
    payment_amount: { type: Number, required: true, min: 0 },
    payment_method: { type: [String], default: undefined },
    status: { type: String, enum: paymentStatuses, default: "pending" },
    notes: { type: String, trim: true },
    // Uploaded via POST /api/v1/upload; stores the returned file_path.
    attachments: { type: String },
    allocations: [allocationSchema],
    debit_notes: [debitNoteAppSchema],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const VendorPaymentModel = model<TVendorPayment>("AccountVendorPayment", schema);
