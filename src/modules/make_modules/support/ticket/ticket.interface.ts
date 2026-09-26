import { Types } from "mongoose";

export const ticketStatuses = ["In Progress", "On Hold", "Closed"] as const;
export const ticketAccountTypes = ["custom", "staff", "client", "vendor"] as const;

export type TTicketAttachment = { name?: string; path?: string };

export type TTicketConversation = {
  _id?: Types.ObjectId;
  sender?: string; // "admin" | "customer" | user identifier
  description?: string;
  attachments?: TTicketAttachment[];
  creator_id?: Types.ObjectId;
  createdAt?: Date;
};

export type TTicket = {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  creator_id?: Types.ObjectId;
  ticket_id: string;
  name?: string;
  email?: string;
  account_type?: string;
  ticket_user_id?: Types.ObjectId;
  category?: Types.ObjectId;
  subject: string;
  status?: string;
  description?: string;
  attachments?: TTicketAttachment[];
  note?: string;
  custom_fields?: Record<string, unknown>;
  conversations?: TTicketConversation[];
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
