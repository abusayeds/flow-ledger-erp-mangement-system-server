import { Types } from 'mongoose';

// 'Unused' is what the app assigns a newly created note that has not been
// applied to an invoice yet — it is the default tab in the credit note list.
export const creditNoteStatus = ['Draft', 'Unused', 'Partial', 'Paid', 'Overdue', 'Recurring', 'Void', 'CreditNotesApplied', 'Open', 'Approved', 'Applied'] as const;
type Status = (typeof creditNoteStatus)[number];

export type TCreditNote = {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  customer_id?: Types.ObjectId;
  /** Typed customer name when none was picked from the list. */
  customer_name?: string;
  /** manual = API create; return = auto from sales/purchase return approve */
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
      description?: string;
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
  Attachment?: string;
  /** Captured customer signature image path. */
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
