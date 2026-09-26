import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../errors/AppError";
import { AuthRequest } from "../../../middlewares/auth";
import { role } from "../../../utils/role";
import { CompanySubscriptionModel } from "./companySubscription/companySubscription.model";
import { UNLIMITED } from "./subscription.constants";

/** The company a request belongs to: company/superadmin use own _id; sub-users use companyId. */
export const resolveCompanyId = (req: AuthRequest): string => {
  const user = req.user;
  if (!user?._id) throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required");
  if (user.role === role.company || user.role === role.superadmin) return String(user._id);
  if (user.companyId) return String(user.companyId);
  throw new AppError(httpStatus.BAD_REQUEST, "Company context is required");
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toPlainLimits = (limits: any): Record<string, number> => {
  if (!limits) return {};
  if (limits instanceof Map) return Object.fromEntries(limits);
  return limits as Record<string, number>;
};

export type ActiveSubscription = {
  exists: boolean; // false = company has not subscribed to any plan yet
  expired: boolean;
  modules: string[];
  limits: Record<string, number>;
  number_of_users: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any;
};

/** Load a company's active subscription snapshot in a guard-friendly shape. */
export const getActiveSubscription = async (
  companyId: string | Types.ObjectId
): Promise<ActiveSubscription> => {
  const sub = await CompanySubscriptionModel.findOne({ company_id: companyId }).lean();
  if (!sub) {
    return { exists: false, expired: false, modules: [], limits: {}, number_of_users: UNLIMITED, raw: null };
  }
  const periodEnded = Boolean(sub.end_date && new Date() > new Date(sub.end_date));
  // Cancelled mid-period still has access until end_date (cancel = stop auto-renew).
  const expired = sub.status === "expired" || periodEnded;
  // If the period already ended after a cancel, flip status for clarity (best-effort).
  if (periodEnded && sub.status === "cancelled") {
    /* leave as-is — expired flag already true for guards */
  } else if (periodEnded && sub.status === "active" && sub.auto_renew === false) {
    void CompanySubscriptionModel.updateOne(
      { _id: sub._id },
      { $set: { status: "expired" } },
    ).catch(() => undefined);
  }
  return {
    exists: true,
    expired,
    modules: sub.modules ?? [],
    limits: toPlainLimits(sub.limits),
    number_of_users: sub.number_of_users ?? UNLIMITED,
    raw: {
      ...sub,
      auto_renew: sub.auto_renew !== false,
      cancel_at_period_end: sub.auto_renew === false || sub.status === "cancelled",
    },
  };
};

/** Cancel auto-renew: keep access until end_date, then expire. */
export const cancelCompanySubscription = async (companyId: string | Types.ObjectId) => {
  const sub = await CompanySubscriptionModel.findOne({ company_id: companyId });
  if (!sub) throw new AppError(httpStatus.NOT_FOUND, "No subscription found to cancel.");

  const periodEnded = Boolean(sub.end_date && new Date() > new Date(sub.end_date));
  if (sub.status === "expired" || periodEnded) {
    throw new AppError(httpStatus.BAD_REQUEST, "This subscription is already expired.");
  }
  if (sub.auto_renew === false || sub.status === "cancelled") {
    throw new AppError(httpStatus.BAD_REQUEST, "Subscription auto-renew is already cancelled.");
  }

  sub.auto_renew = false;
  sub.status = "cancelled";
  sub.cancelled_at = new Date();
  await sub.save();
  return sub;
};
