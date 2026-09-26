import { Types } from "mongoose";

export interface TTicketFieldValue {
  _id?: string;
  user_id: Types.ObjectId;
  record_id: Types.ObjectId;
  field_id: Types.ObjectId;
  value?: unknown;
}
