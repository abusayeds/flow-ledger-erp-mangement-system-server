import { Types } from "mongoose";

export const returnReasons = [
  "Defective",
  "Wrong Item",
  "Damaged",
  "Excess Quantity",
  "Other"
] as const;

export type ReturnReason = typeof returnReasons[number];

export type TInvoiceReturnItem = {
  product_id: Types.ObjectId;
  quantity: number;
  rate?: number;
  amount?: number;
};

export type TInvoiceReturn = {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  invoice_id: Types.ObjectId;
  warehouse_id: Types.ObjectId;
  return_date: Date;
  return_reason: ReturnReason;
  notes?: string;
  status?: string;
  credit_note_id?: Types.ObjectId;
  isDeleted: boolean;
  isArchive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
