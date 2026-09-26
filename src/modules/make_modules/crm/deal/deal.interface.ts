import { Types } from "mongoose";

export type TCrmSub = Record<string, unknown>;

export type TDeal = {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  creator_id?: Types.ObjectId;
  name: string;
  price?: number;
  phone?: string;
  notes?: string;
  pipeline_id?: Types.ObjectId;
  stage_id?: Types.ObjectId;
  order?: number;
  status?: string;
  sources?: Types.ObjectId[];
  products?: Types.ObjectId[];
  labels?: Types.ObjectId[];
  assigned_users?: Types.ObjectId[];
  clients?: Types.ObjectId[];
  tasks?: TCrmSub[];
  calls?: TCrmSub[];
  emails?: TCrmSub[];
  discussions?: TCrmSub[];
  files?: TCrmSub[];
  is_active?: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
};
