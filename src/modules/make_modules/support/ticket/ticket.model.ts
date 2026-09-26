import { Schema, model } from "mongoose";
import { TTicket, ticketStatuses, ticketAccountTypes } from "./ticket.interface";

const attachmentSchema = new Schema({ name: { type: String }, path: { type: String } }, { _id: false });

const conversationSchema = new Schema(
  {
    sender: { type: String, default: "admin" },
    description: { type: String },
    attachments: [attachmentSchema],
    creator_id: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const ticketSchema = new Schema<TTicket>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    creator_id: { type: Schema.Types.ObjectId, ref: "User" },
    ticket_id: { type: String, required: true, index: true },
    name: { type: String },
    email: { type: String },
    account_type: { type: String, enum: ticketAccountTypes, default: "custom" },
    ticket_user_id: { type: Schema.Types.ObjectId, ref: "User" },
    category: { type: Schema.Types.ObjectId, ref: "SupportTicketCategory" },
    subject: { type: String, required: true },
    status: { type: String, enum: ticketStatuses, default: "In Progress" },
    description: { type: String },
    attachments: [attachmentSchema],
    note: { type: String },
    custom_fields: { type: Schema.Types.Mixed, default: {} },
    conversations: [conversationSchema],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const TicketModel = model<TTicket>("SupportTicket", ticketSchema);
