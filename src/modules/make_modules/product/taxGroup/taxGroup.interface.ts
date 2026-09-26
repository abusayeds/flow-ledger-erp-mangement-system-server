import { Types } from "mongoose";

/** How a member tax computes its rate — mirrors the app's "Net Amount" /
 * "Net + Tax Amount" picker. */
export const TAX_BASE_AMOUNTS = ["net_amount", "net_plus_tax_amount"] as const;
export type TTaxBaseAmount = (typeof TAX_BASE_AMOUNTS)[number];

export const TAX_GROUP_STATUS = ["active", "archived"] as const;
export type TTaxGroupStatus = (typeof TAX_GROUP_STATUS)[number];

/** One tax line inside a group. */
export interface TTaxGroupMember {
  tax_id: Types.ObjectId;
  base_amount: TTaxBaseAmount;
}

export interface TTaxGroup {
  _id?: string;
  user_id?: Types.ObjectId;
  name: string;
  members: TTaxGroupMember[];
  apply_to_service: boolean;
  apply_to_product: boolean;
  status: TTaxGroupStatus;
}
