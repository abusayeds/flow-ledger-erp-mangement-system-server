import { Types } from "mongoose";
import { paymentStatuses } from "../customerPayment/customerPayment.interface";

export type TVendorPaymentAllocation = {
  invoice_id: Types.ObjectId;
  allocated_amount: number;
};

export type TDebitNoteApplication = {
  debit_note_id: Types.ObjectId;
  applied_amount: number;
};

export type TVendorPayment = {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  creator_id?: Types.ObjectId;
  payment_number?: string;
  payment_date: Date;
  vendor_id: Types.ObjectId;
  bank_account_id: Types.ObjectId;
  reference_number?: string;
  payment_amount: number;
  payment_method?: string[];
  status: (typeof paymentStatuses)[number];
  notes?: string;
  /** Uploaded file path from POST /api/v1/upload. */
  attachments?: string;
  allocations?: TVendorPaymentAllocation[];
  debit_notes?: TDebitNoteApplication[];
  isDeleted?: boolean;
};
