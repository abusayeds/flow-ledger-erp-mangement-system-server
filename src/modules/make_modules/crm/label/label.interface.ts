import { Types } from "mongoose";

export interface TLabel {
  _id?: string;
  user_id?: Types.ObjectId;
  name: string;
  color?: string;
  pipeline_id?: Types.ObjectId;
  isDeleted?: boolean;
}
