import { Types } from "mongoose";

export const contractStatus = [
  "Draft",
  "Active",
  "Expired",
  "Terminated",
  "Renewed",
] as const;
export type ContractStatus = (typeof contractStatus)[number];

export type TContract = {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  contract_number?: string;
  subject?: string;
  party_name?: string;
  value?: number;
  type?: string;
  start_date?: Date;
  end_date?: Date;
  status?: ContractStatus;
  description?: string;
  duration?: number;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
