import { Types } from "mongoose";

export interface TPipeline {
  _id?: string;
  user_id?: Types.ObjectId;
  name: string;
  isDeleted?: boolean;
}
