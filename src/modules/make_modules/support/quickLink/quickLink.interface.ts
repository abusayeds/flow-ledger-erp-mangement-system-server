import { Types } from "mongoose";

export interface TQuickLink {
  _id?: string;
  user_id?: Types.ObjectId;
  title: string;
  icon?: string;
  link?: string;
  order?: number;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
