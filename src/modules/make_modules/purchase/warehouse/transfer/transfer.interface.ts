import { Types } from "mongoose";

export type TStockTransfer = {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  product_id?: Types.ObjectId;
  product_name?: string;
  from_warehouse: Types.ObjectId;
  to_warehouse: Types.ObjectId;
  quantity: number;
  date: Date;
  notes?: string;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
