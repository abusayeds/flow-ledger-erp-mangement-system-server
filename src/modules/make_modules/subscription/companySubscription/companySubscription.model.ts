import { Schema, model } from "mongoose";
import { BILLING_CYCLES } from "../subscription.constants";
import { TCompanySubscription } from "./companySubscription.interface";

const companySubscriptionSchema = new Schema<TCompanySubscription>(
  {
    company_id: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    plan_id: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    plan_name: { type: String, required: true },

    billing_cycle: { type: String, enum: BILLING_CYCLES, required: true },
    price: { type: Number, default: 0 },

    number_of_users: { type: Number, default: 1 },
    modules: [{ type: String }],
    limits: { type: Map, of: Number, default: {} },

    start_date: { type: Date, required: true },
    end_date: { type: Date, default: null },
    is_trial: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    // false = do not renew after end_date; company keeps access until then.
    auto_renew: { type: Boolean, default: true },
    cancelled_at: { type: Date, default: null },
  },
  { timestamps: true }
);

export const CompanySubscriptionModel = model<TCompanySubscription>(
  "CompanySubscription",
  companySubscriptionSchema
);
