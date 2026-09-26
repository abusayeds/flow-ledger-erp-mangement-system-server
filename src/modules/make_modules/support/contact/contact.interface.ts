import { Types } from "mongoose";

export interface TContact {
  _id?: string;
  user_id?: Types.ObjectId;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  subject?: string;
  message?: string;
  isDeleted?: boolean;
  createdAt?: Date;
}
