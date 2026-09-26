import { Types } from "mongoose";

/** Customer/Vendor address — matches the Laravel `billing_address` / `shipping_address` shape. */
export type TPartyAddress = {
  name?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
};

/** @deprecated old name — use TPartyAddress. */
export type TBusinessAddress = TPartyAddress;

/**
 * Business data for customer / vendor users (stored on the same User model).
 * Only the fields the Laravel customer/vendor forms collect — nothing extra.
 * Common identity fields (name, email, phone) live on the User itself, not here.
 */
export type TBusinessProfile = {
  companyName?: string;
  registration_number?: string;
  tax_number?: string;
  business_phone?: string;
  fax?: string;
  home_phone?: string;
  birthday?: Date;
  anniversary?: Date;
  bank_details?: string;
  payment_terms?: string;
  default_tax_service_id?: Types.ObjectId;
  default_tax_product_id?: Types.ObjectId;
  hourly_rate?: number;
  opening_balance?: number;
  opening_balance_date?: Date;
  payment_reminder?: boolean;
  /** Portal login enabled for this party — drives whether email/password are required. */
  is_login_required?: boolean;
  billing_address?: TPartyAddress;
  shipping_address?: TPartyAddress;
  same_as_billing?: boolean;
  notes?: string;
  active?: boolean;
  isArchive?: boolean;
};

/**
 * Customer / Vendor create + update body.
 * Common identity fields use their natural names (name / email / phone) and map to the User;
 * the rest map into businessProfile.
 */
export type TPartyUserWrite = {
  _id?: Types.ObjectId;
  /** Company (tenant) id — set from the auth token in the controller, not by the client. */
  user_id?: Types.ObjectId;
  name?: string;
  email?: string;
  phone?: string;
  designation?: string;
  /** Portal login — hashed on User; omit on update to keep existing password. */
  password?: string;
  /** Allow login when true; defaults to true when password is set on create. */
  login?: boolean;
  company_name?: string;
  registration_number?: string;
  tax_number?: string;
  business_phone?: string;
  fax?: string;
  home_phone?: string;
  birthday?: Date | string;
  anniversary?: Date | string;
  bank_details?: string;
  payment_terms?: string;
  default_tax_service_id?: Types.ObjectId | string;
  default_tax_product_id?: Types.ObjectId | string;
  hourly_rate?: number;
  opening_balance?: number;
  opening_balance_date?: Date | string;
  payment_reminder?: boolean;
  /**
   * Portal login toggle from the contact form's Settings tab. When true, email +
   * password are required; when false/absent the party is a plain contact record.
   */
  is_login_required?: boolean;
  /** Stored on User root (same as before). */
  currency?: string;
  billing_address?: TPartyAddress;
  shipping_address?: TPartyAddress;
  same_as_billing?: boolean;
  notes?: string;
  /** system flags */
  isDeleted?: boolean;
  active?: boolean;
  isArchive?: boolean;
};
