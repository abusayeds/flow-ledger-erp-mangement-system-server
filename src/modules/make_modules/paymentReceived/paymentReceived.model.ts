import { Schema, model, Types } from 'mongoose';
import { paymentReceivedStatus, TPaymentReceived } from './paymentReceived.interface';

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
    product_id: { type: Types.ObjectId, ref: 'Product', required: true },
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
    quantity: { type: Number },
    rate: { type: Number },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    amount: { type: Number },
  },
  { _id: false }
);

const paymentReceivedSchema = new Schema<TPaymentReceived>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customer_id: { type: Schema.Types.ObjectId, ref: 'User' },
    customer_name: { type: String },
    vendor_id: { type: Schema.Types.ObjectId, ref: 'User' },
    invoice_id: { type: Schema.Types.ObjectId, ref: 'Invoice' },
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
    Attachment: { type: String },
    status: { type: String, enum: paymentReceivedStatus, default: 'Draft' },
    sub_total: { type: Number, default: 0 },
    deposit: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    shipping_cost: { type: Number, default: 0 },
    inline_discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    isArchive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const PaymentReceivedModel = model<TPaymentReceived>('PaymentReceived', paymentReceivedSchema);
