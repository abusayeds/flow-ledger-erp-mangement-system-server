import { Schema, model, Types } from "mongoose";

export const paymentStatuses = ["paid", "partially_refunded", "refunded"] as const;
export const paymentSources = ["stripe", "legacy", "manual"] as const;

export interface TSubscriptionPayment {
  _id?: Types.ObjectId;
  company_id: Types.ObjectId;
  plan_id?: Types.ObjectId;
  plan_name: string;
  amount: number;
  currency: string;
  billing_cycle?: string;
  status: (typeof paymentStatuses)[number];
  refunded_amount: number;
  refund_reason?: string;
  source: (typeof paymentSources)[number];
  stripe_payment_intent?: string;
  stripe_session_id?: string;
  paid_at?: Date;
  refunded_at?: Date;
  refunded_by?: Types.ObjectId;
  isDeleted: boolean;
}

const subscriptionPaymentSchema = new Schema<TSubscriptionPayment>(
  {
    company_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan_id: { type: Schema.Types.ObjectId, ref: "Plan" },
    plan_name: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    billing_cycle: { type: String },
    status: { type: String, enum: paymentStatuses, default: "paid" },
    refunded_amount: { type: Number, default: 0 },
    refund_reason: { type: String },
    source: { type: String, enum: paymentSources, default: "manual" },
    stripe_payment_intent: { type: String },
    stripe_session_id: { type: String, index: true },
    paid_at: { type: Date, default: Date.now },
    refunded_at: { type: Date },
    refunded_by: { type: Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const SubscriptionPaymentModel = model<TSubscriptionPayment>(
  "SubscriptionPayment",
  subscriptionPaymentSchema,
);
