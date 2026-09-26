import { Types } from 'mongoose';

export const invoiceStatus = ['Draft', 'Partial', 'Paid', 'Overdue', 'Recurring', 'Void', 'CreditNotesApplied', 'Open'] as const;
type Status = (typeof invoiceStatus)[number];

export const invoiceRecurring = ['Never', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'] as const;

export type TInvoice = {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  customer_id?: Types.ObjectId;
  customer_name?: string;
  warehouse_id?: Types.ObjectId;
  invoice_number?: string;
  currency?: string;
  date?: Date;
  due_date?: Date;
  sub_title?: string;
  po?: number | string;
  recipient_name?: string;
  shipping_method?: string;
  salesperson?: Types.ObjectId;
  recurring?: (typeof invoiceRecurring)[number];
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
  Attachment?: string;
  signature?: string;
  sub_total: number;
  deposit: number | string;
  discount: number | string;
  shipping_cost: number | string;
  inline_discount: number;
  tax: number;
  // Named-tax rows for the summary / PDF: each tax with its rate, the base it
  // applies to and the resulting amount. Computed client-side (the per-line
  // `tax` is a single numeric rate with no name).
  tax_breakdown?: { name: string; rate: number; base: number; amount: number }[];
  total: number;
  paid_amount?: number;
  balance_amount?: number;
  isDeleted: boolean;
  isArchive: boolean;
  createdAt?: Date;
};
