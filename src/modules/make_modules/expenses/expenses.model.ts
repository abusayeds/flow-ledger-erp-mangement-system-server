import { Schema, model, Types } from 'mongoose';
import { expensesStatus, TExpenses } from './expenses.interface';

const addressSchema = new Schema(
  {
    street: { type: String},
    street2: { type: String },
    city: { type: String},
    state: { type: String },
    zip: { type: String },
    country: { type: String},
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    product_id: { type: Types.ObjectId, ref: 'Product' },
    product_name: { type: String },
    description: { type: String },
    quantity: { type: Number, required: true },
    rate: { type: Number },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    amount: { type: Number },
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

const expensesSchema = new Schema<TExpenses>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customer_id: { type: Schema.Types.ObjectId, ref: 'User' },
    customer_name: { type: String },
    vendor_id: { type: Schema.Types.ObjectId, ref: 'User' },
    vendor_name: { type: String },
    category: { type: String },
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
    status: { type: String, enum: expensesStatus, default: 'Draft' },
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

export const ExpensesModel = model<TExpenses>('Expenses', expensesSchema);
