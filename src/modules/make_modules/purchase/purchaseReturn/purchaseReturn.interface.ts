import { Types } from "mongoose";

export const purchaseReturnReasons = [
  "defective",
  "wrong_item",
  "damaged",
  "excess_quantity",
  "other",
] as const;
export type TPurchaseReturnReason = (typeof purchaseReturnReasons)[number];

export const purchaseReturnStatus = ["draft", "approved", "completed", "processing", "cancelled"] as const;
export type TPurchaseReturnStatus = (typeof purchaseReturnStatus)[number];

export type TPurchaseReturnItem = {
  product_id: Types.ObjectId;
  original_invoice_item_id?: Types.ObjectId;
  original_quantity?: number;
  return_quantity: number;
  unit_price: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;
  reason?: string;
  taxes?: { tax_name: string; tax_rate: number }[];
};

export type TPurchaseReturn = {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  return_number?: string;
  return_date: Date;
  vendor_id: Types.ObjectId;
  warehouse_id?: Types.ObjectId;
  original_invoice_id: Types.ObjectId;
  reason: TPurchaseReturnReason;
  items: TPurchaseReturnItem[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: TPurchaseReturnStatus;
  notes?: string;
  debit_note_id?: Types.ObjectId;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
