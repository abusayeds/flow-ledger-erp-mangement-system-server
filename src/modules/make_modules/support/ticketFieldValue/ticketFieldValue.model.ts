import { Schema, model } from "mongoose";
import { TTicketFieldValue } from "./ticketFieldValue.interface";

const ticketFieldValueSchema = new Schema<TTicketFieldValue>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    record_id: { type: Schema.Types.ObjectId, required: true, ref: "SupportTicket", index: true },
    field_id: { type: Schema.Types.ObjectId, required: true, ref: "SupportTicketField", index: true },
    value: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

ticketFieldValueSchema.index({ record_id: 1, field_id: 1 }, { unique: true });

export const TicketFieldValueModel = model<TTicketFieldValue>("SupportTicketFieldValue", ticketFieldValueSchema);
