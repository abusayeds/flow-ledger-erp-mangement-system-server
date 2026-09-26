import { Types } from 'mongoose';

export const estimateStatus = ['Draft', 'Partial', 'Paid', 'Overdue', 'Recurring', 'Void', 'CreditNotesApplied', 'Open', 'Sent', 'Approved', 'Invoiced'] as const;
type Status = (typeof estimateStatus)[number];

export type TEstimate = {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  customer_id?: Types.ObjectId;
  /** Free-text customer name when no customer_id is picked (party is optional). */
  customer_name?: string;
  vendor_id?: Types.ObjectId;
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
  Attachment?: string;
  signature?: string;
  sub_total: number;
  deposit: number | string;
  discount: number | string;
  shipping_cost: number | string;
  inline_discount: number;
  tax: number;
  tax_breakdown?: { name: string; rate: number; base: number; amount: number }[];
  total: number;
  isDeleted: boolean;
  isArchive: boolean;
  createdAt?: Date;
};
