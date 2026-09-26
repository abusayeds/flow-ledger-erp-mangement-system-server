import { Types } from "mongoose";
import { TBillingCycle } from "../subscription.constants";

export type TCompanySubscriptionStatus = "active" | "expired" | "cancelled";

/**
 * A company's ACTIVE plan snapshot. One per company (company_id unique).
 * This is what the per-API guard reads — it copies modules/limits from the Plan
 * at purchase time (Laravel `assignPlan` equivalent) so changing a plan later
 * does not silently change a live company's entitlements.
 */
export type TCompanySubscription = {
  _id?: Types.ObjectId;
  company_id: Types.ObjectId; // the company User._id
  plan_id: Types.ObjectId;
  plan_name: string;

  billing_cycle: TBillingCycle;
  price: number;

  number_of_users: number; // -1 = unlimited
  modules: string[];
  limits: Record<string, number>; // resourceKey -> max (-1 = unlimited)

  start_date: Date;
  end_date?: Date | null; // null = never expires
  is_trial: boolean;
  status: TCompanySubscriptionStatus;
  /** When false, the plan will not renew after end_date. Access lasts until end_date. */
  auto_renew?: boolean;
  cancelled_at?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
};
