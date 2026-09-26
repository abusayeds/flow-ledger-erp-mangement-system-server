import { Types } from "mongoose";

export interface TFaq {
  _id?: string;
  user_id?: Types.ObjectId;
  creator_id?: Types.ObjectId;
  title: string;
  description?: string;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
