import { Types } from "mongoose";

export const purchaseInvoiceStatus = [
  "draft",
  "posted",
  "partial",
  "paid",
  "overdue",
  // Procurement workflow statuses (set via the dedicated /status/:id endpoint).
  "sent",
  "approved",
  "received",
  "onhold",
  "declined",
] as const;
export type TPurchaseInvoiceStatus = (typeof purchaseInvoiceStatus)[number];

export type TPurchaseInvoice = {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  vendor_id?: Types.ObjectId;
  vendor_name?: string;
  warehouse_id?: Types.ObjectId;
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
  product?: {
    _id?: Types.ObjectId;
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
  terms_and_conditions?: string;
  notes?: string;
  internal_notes?: string;
  Attachment?: string;
  /** Captured vendor signature image path (from POST /api/v1/upload). */
  signature?: string;
  status: TPurchaseInvoiceStatus;
  sub_total: number;
  deposit: number | string;
  discount: number | string;
  shipping_cost: number | string;
  inline_discount: number;
  tax: number;
  tax_breakdown?: { name: string; rate: number; base: number; amount: number }[];
  total: number;
  paid_amount: number;
  debit_note_applied: number;
  balance_amount: number;
  payment_terms?: string;
  isDeleted: boolean;
  isArchive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
