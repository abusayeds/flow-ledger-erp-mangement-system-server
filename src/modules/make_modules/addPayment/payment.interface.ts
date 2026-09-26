import { Types } from "mongoose";

export type TPayment = {
  user_id: Types.ObjectId;
  customer_id: Types.ObjectId;
  /** Shown on PDF as "Payment #". */
  payment_number?: string;
  payment_date: Date;
  payment_type: string;
  amount: number;
  notes?: string;
  internal_notes?: string;
  attachments?: string;
  type?: string;
  invoice_id?: Types.ObjectId;
  isDeleted?: boolean;
  isArchive?: boolean;
  isActive?: boolean;
  createdAt?: Date;
};
