import { Types } from 'mongoose';

export const billStatus = ['Draft', 'Partial', 'Paid', 'Overdue', 'Recurring', 'Void', 'CreditNotesApplied', 'Open'] as const;
type Status = (typeof billStatus)[number];

export type TBill = {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  customer_id?: Types.ObjectId;
  customer_name?: string;
  vendor_id?: Types.ObjectId;
  vendor_name?: string;
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
  /** Captured vendor signature image path (rendered in the bill PDF). */
  signature?: string;
  sub_total: number;
  deposit: number | string;
  discount: number | string;
  shipping_cost: number | string;
  inline_discount: number;
  tax: number;
  tax_breakdown?: { name: string; rate: number; base: number; amount: number }[];
  total: number;
  paid_amount?: number;
  balance_amount?: number;
  isDeleted: boolean;
  isArchive: boolean;
  createdAt?: Date;
};
