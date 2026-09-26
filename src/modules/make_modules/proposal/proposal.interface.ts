import { Types } from "mongoose";

export const proposalStatus = [
  "Draft",
  "Partial",
  "Paid",
  "Overdue",
  "Recurring",
  "Void",
  "CreditNotesApplied",
  "Open",
] as const;
type Status = (typeof proposalStatus)[number];

export type TProposal = {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  customer_id?: Types.ObjectId;
  vendor_id?: Types.ObjectId;
  warehouse_id?: Types.ObjectId;
  proposal_number?: string;
  proposal_date?: Date;
  due_date?: Date;
  discount_before_tax?: number;
  product?: {
    product_id?: Types.ObjectId;
    product_name?: string;
    description?: string;
    quantity: number;
    rate: number;
    tax: number;
    discount: number;
    amount: number;
  }[];
  service?: {
    service_id?: Types.ObjectId;
    service_name?: string;
    quantity: number;
    rate: number;
    tax: number;
    discount: number;
    amount: number;
  }[];
  status: Status;
  notes?: string;
  deposit: number | string;
  discount: number | string;
  shipping_cost: number | string;
  inline_discount: number;
  tax: number;
  total: number;
  isDeleted: boolean;
  isArchive: boolean;
  createdAt?: Date;
};
