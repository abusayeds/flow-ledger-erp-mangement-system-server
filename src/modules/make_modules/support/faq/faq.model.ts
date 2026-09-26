import { Schema, model } from "mongoose";
import { TFaq } from "./faq.interface";

const faqSchema = new Schema<TFaq>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    creator_id: { type: Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const FaqModel = model<TFaq>("SupportFaq", faqSchema);
