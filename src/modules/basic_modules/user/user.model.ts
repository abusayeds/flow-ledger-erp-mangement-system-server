import bcrypt from "bcrypt";
import mongoose, { Schema } from "mongoose";
import { IOTP, IUser } from "./user.interface";
import { role } from "../../../utils/role";
import { TPartyAddress } from "./user.business.interface";

const addressSchema = new Schema<TPartyAddress>(
  {
    name: { type: String },
    address_line_1: { type: String },
    address_line_2: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    zip_code: { type: String },
  },
  { _id: false }
);

const businessProfileSchema = new Schema(
  {
    companyName: { type: String, trim: true },
    registration_number: { type: String },
    tax_number: { type: String },
    business_phone: { type: String },
    fax: { type: String },
    home_phone: { type: String },
    birthday: { type: Date },
    anniversary: { type: Date },
    bank_details: { type: String },
    payment_terms: { type: String },
    default_tax_service_id: { type: Schema.Types.ObjectId, ref: "Tax" },
    default_tax_product_id: { type: Schema.Types.ObjectId, ref: "Tax" },
    hourly_rate: { type: Number },
    opening_balance: { type: Number, default: 0 },
    opening_balance_date: { type: Date },
    payment_reminder: { type: Boolean, default: false },
    is_login_required: { type: Boolean, default: false },
    billing_address: { type: addressSchema },
    shipping_address: { type: addressSchema },
    same_as_billing: { type: Boolean, default: false },
    notes: { type: String },
    active: { type: Boolean, default: true },
    isArchive: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, trim: true },
    email: { type: String, required: false, unique: true, sparse: true, trim: true },
    password: {
      type: String,
      required: function (this: IUser) {
        if (this.authProvider === "google") return false;
        if (this.role === role.customer || this.role === role.vendor) return false;
        return true;
      },
      minlength: 3,
      set: (v: string) => {
        if (!v) return v;
        return bcrypt.hashSync(v, bcrypt.genSaltSync(Number(12)));
      },
      select: 0,
    },
    phone: { type: String, trim: true },
    designation: { type: String, trim: true },
    language: { type: String, trim: true },
    currency: { type: String, trim: true },
    country: { type: String, trim: true },
    address: { type: String },
    // company new field 
    website: { type: String, trim: true },
    signature: { type: String, trim: true },
    number_format : { type: String, trim: true },
    decimal_separator : { type: String, trim: true },
    payment_terms_sales : { type: String, trim: true },
    payment_terms_purchase : { type: String, trim: true },
    image: { type: String, trim: true },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    // Base enum roles OR a company-defined custom role name (validated in service).
    role: {
      type: String,
      required: true,
      trim: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Which super admin created this account (used for super-admin team management).
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    businessProfile: { type: businessProfileSchema },
    permissions: [{ type: String }],
    permissionsOverridden: { type: Boolean, default: false, select: false },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    // Set by superadmin BlockUser (existing endpoint); undefined == "active".
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },
    isVerify: {
      type: Boolean,
      default: false,
    },
    login: {
      type: Boolean,
      default: true,
    },
    is_trial_done: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

const OTPSchema = new Schema<IOTP>({
  email: { type: String, required: true, trim: true },
  otp: { type: String, required: true, trim: true },
  expiresAt: { type: Date, required: true },
});

export const OTPModel = mongoose.model<IOTP>("OTP", OTPSchema);
