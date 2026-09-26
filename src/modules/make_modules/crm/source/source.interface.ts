import { Types } from "mongoose";

export interface TSource {
  _id?: string;
  user_id?: Types.ObjectId;
  name: string;
  isDeleted?: boolean;
}
