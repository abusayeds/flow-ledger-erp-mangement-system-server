import { Types } from "mongoose";

export interface TKnowledgeCategory {
  _id?: string;
  user_id?: Types.ObjectId;
  creator_id?: Types.ObjectId;
  title: string;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
