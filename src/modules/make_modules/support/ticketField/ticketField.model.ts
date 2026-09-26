import { Schema, model } from "mongoose";
import { TTicketField, ticketFieldTypes } from "./ticketField.interface";

const ticketFieldSchema = new Schema<TTicketField>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ticketFieldTypes, default: "text" },
    placeholder: { type: String },
    width: { type: String, default: "6" },
    order: { type: Number, default: 0 },
    status: { type: Boolean, default: true },
    is_required: { type: Boolean, default: false },
    options: [{ type: String }],
    custom_id: { type: Number },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const TicketFieldModel = model<TTicketField>("SupportTicketField", ticketFieldSchema);
