import { Schema, model, Types } from 'mongoose';
import { debitNoteStatus, TDebitNote } from './debitNote.interface';

const addressSchema = new Schema(
  {
    street: { type: String, required: true },
    street2: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    zip: { type: String },
    country: { type: String, required: true },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    // Optional: picked product (product_id) OR typed free-text product_name.
    product_id: { type: Types.ObjectId, ref: 'Product' },
    product_name: { type: String },
    description: { type: String },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const serviceSchema = new Schema(
  {
    service_id: { type: Types.ObjectId, ref: 'Service' },
    service_name: { type: String },
    quantity: { type: Number },
    rate: { type: Number },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    amount: { type: Number },
  },
  { _id: false }
);

const debitNoteSchema = new Schema<TDebitNote>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vendor_id: { type: Schema.Types.ObjectId, ref: 'User' },
    vendor_name: { type: String },
    source: { type: String, enum: ['manual', 'return'], default: 'manual' },
    return_id: { type: Schema.Types.ObjectId, ref: 'ReturnPurchase' },
    source_invoice_id: { type: Schema.Types.ObjectId },
    return_reason: { type: String },
    invoice_number: { type: String },
    currency: { type: String },
    date: { type: Date },
    due_date: { type: Date },
    sub_title: { type: String },
    po: { type: Schema.Types.Mixed },
    shipping_method: { type: String },
    payment_method: [{ type: String }],
    discount_before_tax: { type: Number, default: 0 },
    billing_address: { type: addressSchema },
    shipping_address: { type: addressSchema },
    product: [productSchema],
    service: [serviceSchema],
    terms_and_conditions: { type: String },
    notes: { type: String },
    internal_notes: { type: String },
    // Uploaded via POST /api/v1/upload; stores the returned file_path.
    attachments: { type: String },
    Attachment: { type: String },
    // Captured vendor signature — server-relative path from POST /api/v1/upload.
    signature: { type: String },
    status: { type: String, enum: debitNoteStatus, default: 'Draft' },
    sub_total: { type: Number, default: 0 },
    deposit: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    shipping_cost: { type: Number, default: 0 },
    inline_discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    tax_breakdown: {
      type: [
        {
          _id: false,
          name: { type: String },
          rate: { type: Number, default: 0 },
          base: { type: Number, default: 0 },
          amount: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    total: { type: Number, default: 0 },
    applied_amount: { type: Number, default: 0 },
    balance_amount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    isArchive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const DebitNoteModel = model<TDebitNote>('DebitNote', debitNoteSchema);
