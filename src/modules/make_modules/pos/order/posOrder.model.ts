import { Schema, model, Types } from "mongoose";

export interface TPosOrderItem {
  product_id?: Types.ObjectId;
  name: string;
  sku?: string;
  quantity: number;
  price: number;
  tax_rate: number;
}

export interface TPosOrder {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  order_number: string;
  date?: Date;
  customer_name?: string;
  customer_id?: Types.ObjectId;
  warehouse?: string;
  warehouse_id?: Types.ObjectId;
  bank_account?: string;
  bank_account_id?: Types.ObjectId;
  items: TPosOrderItem[];
  discount: number;
  sub_total: number;
  tax: number;
  total: number;
  status: string;
  isDeleted: boolean;
}

const posOrderItemSchema = new Schema<TPosOrderItem>(
  {
    product_id: { type: Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    sku: { type: String, default: "" },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    tax_rate: { type: Number, default: 0 },
  },
  { _id: false },
);

const posOrderSchema = new Schema<TPosOrder>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    order_number: { type: String, required: true },
    date: { type: Date, default: Date.now },
    customer_name: { type: String, default: "Walk-in Customer" },
    customer_id: { type: Schema.Types.ObjectId, ref: "Customer" },
    warehouse: { type: String, default: "" },
    warehouse_id: { type: Schema.Types.ObjectId, ref: "Warehouse" },
    bank_account: { type: String, default: "" },
    bank_account_id: { type: Schema.Types.ObjectId, ref: "BankAccount" },
    items: { type: [posOrderItemSchema], default: [] },
    discount: { type: Number, default: 0 },
    sub_total: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: { type: String, default: "Completed" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const PosOrderModel = model<TPosOrder>("PosOrder", posOrderSchema);
