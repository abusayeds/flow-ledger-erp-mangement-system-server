import { Schema, model } from "mongoose";
import { TContact } from "./contact.interface";

const contactSchema = new Schema<TContact>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String },
    first_name: { type: String },
    last_name: { type: String },
    email: { type: String, required: true },
    subject: { type: String },
    message: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ContactModel = model<TContact>("SupportContact", contactSchema);
