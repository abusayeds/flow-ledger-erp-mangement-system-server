import { Schema, model } from "mongoose";
import { TQuickLink } from "./quickLink.interface";

const quickLinkSchema = new Schema<TQuickLink>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    title: { type: String, required: true, trim: true },
    icon: { type: String },
    link: { type: String },
    order: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const QuickLinkModel = model<TQuickLink>("SupportQuickLink", quickLinkSchema);
