import { Schema, model, Types } from "mongoose";

export interface TReferral {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  email: string;
  status: string;
  isDeleted: boolean;
}

const referralSchema = new Schema<TReferral>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true },
    status: { type: String, default: "Sent" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const ReferralModel = model<TReferral>("Referral", referralSchema);
