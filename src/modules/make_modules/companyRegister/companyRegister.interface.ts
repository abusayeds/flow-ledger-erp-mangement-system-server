import { Types } from "mongoose";

export type TCompanyRegister = {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  business_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  website?: string;
  billing_address?: string;
  shipping_address?: string;
  same_as_billing?: boolean;
  reg_no?: string;
  vat?: string;
  payment_terms_sales?: string;
  payment_terms_purchase?: string;
  start_fiscal_year?: string;
  /** Company logo path/URL (from /upload). */
  logo?: string;
  is_owner?: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
