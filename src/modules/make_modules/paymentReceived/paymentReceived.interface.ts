import { Types } from 'mongoose';

export const paymentReceivedStatus = ['Draft', 'Partial', 'Paid', 'Overdue', 'Recurring', 'Void', 'CreditNotesApplied', 'Open'] as const;
type Status = (typeof paymentReceivedStatus)[number];

export type TPaymentReceived = {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  customer_id?: Types.ObjectId;
  /** Typed customer name when none was picked from the list. */
  customer_name?: string;
  vendor_id?: Types.ObjectId;
  /** The invoice this payment is applied to (drives its Paid/Partial status). */
  invoice_id?: Types.ObjectId;
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
      product_id: Types.ObjectId;
      quantity: number;
      rate: number;
      tax: number;
      discount: number;
      amount: number;
    }
  ];
  service?: [
    {
      service_id: Types.ObjectId;
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
  sub_total: number;
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
