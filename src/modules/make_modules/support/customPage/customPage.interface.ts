import { Types } from "mongoose";

export interface TCustomPage {
  _id?: string;
  user_id?: Types.ObjectId;
  title: string;
  slug: string;
  enable_page_footer?: boolean;
  contents?: string;
  description?: string;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
