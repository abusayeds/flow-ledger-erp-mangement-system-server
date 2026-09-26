import { Schema, model } from "mongoose";
import { TCustomPage } from "./customPage.interface";

const customPageSchema = new Schema<TCustomPage>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    enable_page_footer: { type: Boolean, default: false },
    contents: { type: String },
    description: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const CustomPageModel = model<TCustomPage>("SupportCustomPage", customPageSchema);
