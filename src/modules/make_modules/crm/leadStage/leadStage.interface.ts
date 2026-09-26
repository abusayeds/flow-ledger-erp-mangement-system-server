import { Types } from "mongoose";

export interface TLeadStage {
  _id?: string;
  user_id?: Types.ObjectId;
  name: string;
  pipeline_id: Types.ObjectId;
  order?: number;
  isDeleted?: boolean;
}
