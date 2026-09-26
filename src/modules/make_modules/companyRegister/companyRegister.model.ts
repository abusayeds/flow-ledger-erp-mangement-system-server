import { Schema, model } from "mongoose";
import { TCompanyRegister } from "./companyRegister.interface";

const companyRegisterSchema = new Schema<TCompanyRegister>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    business_name: { type: String, trim: true },
    email: { type: String },
    phone: { type: String },
    mobile: { type: String },
    fax: { type: String },
    website: { type: String },
    billing_address: { type: String },
    shipping_address: { type: String },
    same_as_billing: { type: Boolean, default: false },
    reg_no: { type: String },
    vat: { type: String },
    payment_terms_sales: { type: String },
    payment_terms_purchase: { type: String },
    start_fiscal_year: { type: String },
    logo: { type: String, trim: true },
    is_owner: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const CompanyRegisterModel = model<TCompanyRegister>("CompanyRegister", companyRegisterSchema);
