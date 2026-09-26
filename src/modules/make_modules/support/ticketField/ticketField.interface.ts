import { Types } from "mongoose";

export const ticketFieldTypes = ["text", "email", "number", "date", "textarea", "file", "select"] as const;

export interface TTicketField {
  _id?: string;
  user_id?: Types.ObjectId;
  name: string;
  type?: string;
  placeholder?: string;
  width?: string;
  order?: number;
  status?: boolean;
  is_required?: boolean;
  options?: string[];
  custom_id?: number;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
