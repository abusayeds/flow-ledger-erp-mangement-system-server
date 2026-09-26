import { Types } from 'mongoose';

export const debitNoteStatus = ['Draft', 'Partial', 'Paid', 'Overdue', 'Recurring', 'Void', 'CreditNotesApplied', 'Open', 'Approved', 'Applied'] as const;
type Status = (typeof debitNoteStatus)[number];

export type TDebitNote = {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  vendor_id?: Types.ObjectId;
  vendor_name?: string;
  source?: "manual" | "return";
  return_id?: Types.ObjectId;
  source_invoice_id?: Types.ObjectId;
  return_reason?: string;
  invoice_number?: string;
  currency?: string;
  date?: Date;
  due_date?: Date;
  sub_title?: string;
  po?: number | string;
  shipping_method?: string;
  payment_method?: string[];
  discount_before_tax?: number;
  billing_address?: {
    street: string;
    street2?: string;
    city: string;
    state?: string;
    zip?: string;
    country: string;
  };
  shipping_address?: {
    street: string;
    street2?: string;
    city: string;
    state?: string;
    zip?: string;
    country: string;
  };
  product?: [
    {
      product_id?: Types.ObjectId;
      product_name?: string;
      description?: string;
      quantity: number;
      rate: number;
      tax: number;
      discount: number;
      amount: number;
    }
  ];
  service?: [
    {
      service_id?: Types.ObjectId;
      service_name?: string;
      quantity: number;
      rate: number;
      tax: number;
      discount: number;
      amount: number;
    }
  ];
  status: Status;
  terms_and_conditions?: string;
  notes?: string;
  internal_notes?: string;
  /** Uploaded file path from POST /api/v1/upload. */
  attachments?: string;
  Attachment?: string;
  /** Server-relative path to the captured vendor signature image. */
  signature?: string;
  sub_total: number;
  deposit: number | string;
  discount: number | string;
  shipping_cost: number | string;
  inline_discount: number;
  tax: number;
  tax_breakdown?: { name: string; rate: number; base: number; amount: number }[];
  total: number;
  applied_amount?: number;
  balance_amount?: number;
  isDeleted: boolean;
  isArchive: boolean;
  createdAt?: Date;
};
