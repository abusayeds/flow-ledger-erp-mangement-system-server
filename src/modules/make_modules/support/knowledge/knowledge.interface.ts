import { Types } from "mongoose";

export interface TKnowledge {
  _id?: string;
  user_id?: Types.ObjectId;
  creator_id?: Types.ObjectId;
  title: string;
  description?: string;
  category?: Types.ObjectId;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
