import { Types } from "mongoose";

export const TAX_TYPES = ["product", "service", "both"] as const;
export type TTaxType = (typeof TAX_TYPES)[number];

export interface TTax {
  _id?: string;
  user_id?: Types.ObjectId;
  name: string;
  rate: number;
  type: TTaxType;
}

/** Tax types allowed when assigning to a product or service. */
export const taxTypesForProduct = ["product", "both"] as const;
export const taxTypesForService = ["service", "both"] as const;
