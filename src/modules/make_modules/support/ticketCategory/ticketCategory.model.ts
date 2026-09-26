import { Schema, model } from "mongoose";
import { TTicketCategory } from "./ticketCategory.interface";

const ticketCategorySchema = new Schema<TTicketCategory>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    creator_id: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: "#000000" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const TicketCategoryModel = model<TTicketCategory>("SupportTicketCategory", ticketCategorySchema);
