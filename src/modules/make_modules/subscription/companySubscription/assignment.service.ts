import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../../errors/AppError";
import { PlanModel } from "../plan/plan.model";
import { TBillingCycle } from "../subscription.constants";
import { CompanySubscriptionModel } from "./companySubscription.model";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toPlainLimits = (limits: any): Record<string, number> => {
  if (!limits) return {};
  if (limits instanceof Map) return Object.fromEntries(limits);
  return limits as Record<string, number>;
};

const computeEndDate = (cycle: TBillingCycle, trialDays: number): Date | null => {
  const end = new Date();
  if (cycle === "monthly") end.setMonth(end.getMonth() + 1);
  else if (cycle === "yearly") end.setFullYear(end.getFullYear() + 1);
  else if (cycle === "trial") end.setDate(end.getDate() + (trialDays || 0));
  return end;
};

const priceFor = (
  cycle: TBillingCycle,
  plan: { price_monthly: number; price_yearly: number }
): number => {
  if (cycle === "monthly") return plan.price_monthly;
  if (cycle === "yearly") return plan.price_yearly;
  return 0; // trial
};

/**
 * Activate a plan for a company (Laravel `assignPlan` equivalent).
 * Copies modules + limits + user cap from the Plan into a per-company snapshot,
 * computes expiry from the billing cycle, and upserts one doc per company.
 */
export const assignPlan = async (
  companyId: string,
  planId: string,
  billingCycle: TBillingCycle
) => {
  const plan = await PlanModel.findOne({ _id: planId, isDeleted: false });
  if (!plan) throw new AppError(httpStatus.NOT_FOUND, "Plan not found");

  if (billingCycle === "trial" && !plan.trial) {
    throw new AppError(httpStatus.BAD_REQUEST, "This plan does not offer a trial.");
  }

  const snapshot = {
    company_id: new Types.ObjectId(companyId),
    plan_id: plan._id,
    plan_name: plan.name,
    billing_cycle: billingCycle,
    price: priceFor(billingCycle, plan),
    number_of_users: plan.number_of_users,
    modules: plan.modules ?? [],
    limits: toPlainLimits(plan.limits),
    start_date: new Date(),
    end_date: computeEndDate(billingCycle, plan.trial_days),
    is_trial: billingCycle === "trial",
    status: "active" as const,
    auto_renew: true,
    cancelled_at: null,
  };

  const sub = await CompanySubscriptionModel.findOneAndUpdate(
    { company_id: snapshot.company_id },
    { $set: snapshot },
    { new: true, upsert: true, runValidators: true }
  );

  return sub;
};
