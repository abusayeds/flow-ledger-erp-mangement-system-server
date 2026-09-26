import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../errors/AppError";
import { UserModel } from "../../basic_modules/user/user.model";
import { CompanySubscriptionModel } from "../subscription/companySubscription/companySubscription.model";
import { PlanModel } from "../subscription/plan/plan.model";
import jwt from "jsonwebtoken";
import { assignPlan } from "../subscription/companySubscription/assignment.service";
import type { TBillingCycle } from "../subscription/subscription.constants";
import { SubscriptionPaymentModel } from "../subscription/subscriptionPayment/subscriptionPayment.model";
import { stripe } from "../subscription/checkout/checkout.service";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY = 24 * 60 * 60 * 1000;

/** Monthly-equivalent price of a subscription (yearly ÷ 12). */
const monthlyEquivalent = (s: any): number => {
  const price = Number(s.price) || 0;
  return s.billing_cycle === "yearly" ? price / 12 : price;
};

const classify = (s: any, now: Date): "active" | "trialing" | "expired" | "cancelled" => {
  const expiredByDate = s.end_date && new Date(s.end_date).getTime() < now.getTime();
  if (s.status === "cancelled") return "cancelled";
  if (s.status === "expired" || expiredByDate) return "expired";
  if (s.is_trial || s.billing_cycle === "trial") return "trialing";
  return "active";
};

const overview = async () => {
  const now = new Date();
  const [companyCount, roleAgg, subs, planCount] = await Promise.all([
    UserModel.countDocuments({ role: "company", isDeleted: { $ne: true } }),
    UserModel.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
    CompanySubscriptionModel.find({}).lean(),
    PlanModel.countDocuments({ isDeleted: { $ne: true } }),
  ]);

  const usersByRole: Record<string, number> = {};
  let totalUsers = 0;
  for (const r of roleAgg as any[]) {
    usersByRole[r._id || "unknown"] = r.count;
    totalUsers += r.count;
  }

  let active = 0, trialing = 0, expired = 0, cancelled = 0, mrr = 0;
  const byPlan = new Map<string, number>();
  for (const s of subs as any[]) {
    const state = classify(s, now);
    if (state === "active") active++;
    else if (state === "trialing") trialing++;
    else if (state === "expired") expired++;
    else cancelled++;
    if (state === "active") {
      mrr += monthlyEquivalent(s);
      byPlan.set(s.plan_name || "—", (byPlan.get(s.plan_name || "—") || 0) + 1);
    }
  }

  const [new7, new30] = await Promise.all([
    UserModel.countDocuments({ role: "company", isDeleted: { $ne: true }, createdAt: { $gte: new Date(now.getTime() - 7 * DAY) } }),
    UserModel.countDocuments({ role: "company", isDeleted: { $ne: true }, createdAt: { $gte: new Date(now.getTime() - 30 * DAY) } }),
  ]);

  // Company signups per month for the last 6 months.
  const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const companies = await UserModel.find({ role: "company", isDeleted: { $ne: true }, createdAt: { $gte: trendStart } })
    .select("createdAt")
    .lean();
  const buckets: { label: string; key: string; companies: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ label: MONTHS[d.getMonth()], key: `${d.getFullYear()}-${d.getMonth()}`, companies: 0 });
  }
  const bucketByKey = new Map(buckets.map((b) => [b.key, b]));
  for (const c of companies as any[]) {
    const d = new Date(c.createdAt);
    const b = bucketByKey.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (b) b.companies++;
  }

  return {
    stats: {
      total_companies: companyCount,
      total_users: totalUsers,
      mrr: +mrr.toFixed(2),
      active_subscriptions: active,
      trials: trialing,
      expired,
      total_plans: planCount,
      new_companies_7d: new7,
      new_companies_30d: new30,
    },
    users_by_role: usersByRole,
    subscriptions_by_status: { active, trialing, expired, cancelled },
    subscriptions_by_plan: [...byPlan.entries()].map(([name, count]) => ({ name, count })),
    signup_trend: buckets.map((b) => ({ month: b.label, companies: b.companies })),
  };
};

const companies = async (query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = { role: "company", isDeleted: { $ne: true } };
  const search = (query.search as string) || "";
  if (search.trim()) {
    const rx = new RegExp(search.trim(), "i");
    filter.$or = [{ name: rx }, { email: rx }, { "businessProfile.companyName": rx }];
  }
  if (query.status === "active" || query.status === "blocked") filter.status = query.status;

  const rows = await UserModel.find(filter)
    .select("name email status businessProfile createdAt phone image")
    .sort({ createdAt: -1 })
    .lean();

  const ids = rows.map((c: any) => c._id);
  const [subs, counts] = await Promise.all([
    CompanySubscriptionModel.find({ company_id: { $in: ids } }).lean(),
    UserModel.aggregate([
      { $match: { companyId: { $in: ids }, isDeleted: { $ne: true } } },
      { $group: { _id: "$companyId", count: { $sum: 1 } } },
    ]),
  ]);
  const subByCompany = new Map((subs as any[]).map((s) => [String(s.company_id), s]));
  const countByCompany = new Map((counts as any[]).map((c) => [String(c._id), c.count]));
  const now = new Date();

  let filtered = rows.map((c: any) => {
    const s = subByCompany.get(String(c._id));
    return {
      _id: c._id,
      name: c.businessProfile?.companyName || c.name || "—",
      owner_name: c.name || "",
      email: c.email || "",
      phone: c.phone || "",
      status: c.status || "active",
      plan_name: s?.plan_name || null,
      subscription_status: s ? classify(s, now) : "none",
      is_trial: s?.is_trial || false,
      subscription_price: s?.price ?? 0,
      billing_cycle: s?.billing_cycle || null,
      subscription_end: s?.end_date || null,
      users_count: countByCompany.get(String(c._id)) || 0,
      created_at: c.createdAt,
    };
  });

  if (query.plan) filtered = filtered.filter((c) => c.plan_name === query.plan);
  if (query.subscription) filtered = filtered.filter((c) => c.subscription_status === query.subscription);

  return filtered;
};

const companyDetail = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) throw new AppError(httpStatus.BAD_REQUEST, "Invalid company id");
  const company = await UserModel.findOne({ _id: id, role: "company" }).select("-password").lean();
  if (!company) throw new AppError(httpStatus.NOT_FOUND, "Company not found");

  const [subscription, users] = await Promise.all([
    CompanySubscriptionModel.findOne({ company_id: id })
      .populate("plan_id", "name price_monthly price_yearly number_of_users")
      .lean(),
    UserModel.find({ companyId: id, isDeleted: { $ne: true } })
      .select("name email role status createdAt")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  // Surface the effective status (date-aware), matching the list view.
  const sub = subscription
    ? { ...subscription, status: classify(subscription, new Date()) }
    : null;

  return { company, subscription: sub, users, users_count: users.length };
};

const users = async (query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = { isDeleted: { $ne: true } };
  if (query.role) filter.role = query.role;
  if (query.status === "active" || query.status === "blocked") filter.status = query.status;
  const search = (query.search as string) || "";
  if (search.trim()) {
    const rx = new RegExp(search.trim(), "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const rows = await UserModel.find(filter)
    .select("name email role status companyId businessProfile createdAt")
    .populate("companyId", "name businessProfile")
    .sort({ createdAt: -1 })
    .limit(1000)
    .lean();

  return (rows as any[]).map((u) => {
    const parent = u.companyId as any;
    const company =
      u.role === "company"
        ? u.businessProfile?.companyName || u.name || "—"
        : parent
          ? parent.businessProfile?.companyName || parent.name || "—"
          : null;
    return {
      _id: u._id,
      name: u.name || "—",
      email: u.email || "",
      role: u.role,
      status: u.status || "active",
      company,
      created_at: u.createdAt,
    };
  });
};

const subscriptions = async (query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = {};
  const rows = await CompanySubscriptionModel.find(filter)
    .populate("company_id", "name email businessProfile")
    .sort({ createdAt: -1 })
    .lean();
  const now = new Date();
  let mapped = (rows as any[]).map((s) => {
    const c = s.company_id as any;
    const state = classify(s, now);
    return {
      _id: s._id,
      company_id: c?._id ?? null,
      company_name: c?.businessProfile?.companyName || c?.name || "—",
      company_email: c?.email || "",
      plan_id: s.plan_id,
      plan_name: s.plan_name,
      billing_cycle: s.billing_cycle,
      price: s.price ?? 0,
      number_of_users: s.number_of_users ?? 0,
      is_trial: s.is_trial ?? false,
      start_date: s.start_date,
      end_date: s.end_date,
      status: state,
    };
  });
  if (query.status) mapped = mapped.filter((s) => s.status === query.status);
  return mapped;
};

const assignSubscription = async (body: Record<string, unknown>) => {
  const companyId = String(body.company_id || "");
  const planId = String(body.plan_id || "");
  const cycle = String(body.billing_cycle || "") as TBillingCycle;
  if (!companyId || !planId || !cycle) {
    throw new AppError(httpStatus.BAD_REQUEST, "company_id, plan_id and billing_cycle are required");
  }
  const company = await UserModel.findOne({ _id: companyId, role: "company" });
  if (!company) throw new AppError(httpStatus.NOT_FOUND, "Company not found");
  return assignPlan(companyId, planId, cycle);
};

const updateSubscription = async (id: string, body: Record<string, unknown>) => {
  const sub = await CompanySubscriptionModel.findById(id);
  if (!sub) throw new AppError(httpStatus.NOT_FOUND, "Subscription not found");

  const action = body.action as string | undefined;
  if (action === "cancel") {
    sub.status = "cancelled";
  } else if (action === "activate") {
    sub.status = "active";
  } else if (action === "extend") {
    const days = Number(body.days) || 30;
    const base = sub.end_date && new Date(sub.end_date).getTime() > Date.now() ? new Date(sub.end_date) : new Date();
    base.setDate(base.getDate() + days);
    sub.end_date = base;
    sub.status = "active";
  } else if (body.end_date) {
    sub.end_date = new Date(String(body.end_date));
  }
  if (body.status === "active" || body.status === "expired" || body.status === "cancelled") {
    sub.status = body.status;
  }
  await sub.save();
  return sub;
};

/**
 * Mint a short-lived, READ-ONLY company-scoped token so a super admin can view a
 * tenant's data through the normal tenant app. The token mirrors the login token
 * shape (`{ user: { _id, email, role } }`) so every company-scoped endpoint works,
 * plus an `impersonated_by` claim that (a) marks it read-only via the guard and
 * (b) records who is impersonating.
 */
const impersonate = async (companyId: string, superadminId: string) => {
  const company = (await UserModel.findOne({ _id: companyId, role: "company", isDeleted: { $ne: true } })
    .select("name email businessProfile")
    .lean()) as any;
  if (!company) throw new AppError(httpStatus.NOT_FOUND, "Company not found");

  const token = jwt.sign(
    {
      user: { _id: String(company._id), email: company.email, role: "company" },
      impersonated_by: String(superadminId),
    },
    process.env.JWT_SECRET_KEY as string,
    { expiresIn: "1h" },
  );

  return {
    token,
    company: {
      id: company._id,
      name: (company as any).businessProfile?.companyName || company.name || "Company",
      email: company.email,
    },
  };
};

const payments = async (query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = { isDeleted: { $ne: true } };
  if (query.status) filter.status = query.status;
  const rows = await SubscriptionPaymentModel.find(filter)
    .populate("company_id", "name email businessProfile")
    .sort({ paid_at: -1 })
    .lean();
  return (rows as any[]).map((p) => {
    const c = p.company_id as any;
    return {
      _id: p._id,
      company_id: c?._id ?? null,
      company_name: c?.businessProfile?.companyName || c?.name || "—",
      company_email: c?.email || "",
      plan_name: p.plan_name,
      amount: p.amount,
      currency: p.currency,
      billing_cycle: p.billing_cycle,
      status: p.status,
      refunded_amount: p.refunded_amount || 0,
      refund_reason: p.refund_reason || null,
      source: p.source,
      via_stripe: !!p.stripe_payment_intent,
      paid_at: p.paid_at,
      refunded_at: p.refunded_at || null,
    };
  });
};

/**
 * Refund a subscription payment (full or partial). If the payment was made via
 * Stripe (has a payment_intent), issue a real Stripe refund; otherwise record a
 * manual/admin refund on the ledger. Idempotency: cannot exceed the paid amount.
 */
const refundPayment = async (id: string, body: Record<string, unknown>, adminId: string) => {
  const p = await SubscriptionPaymentModel.findById(id);
  if (!p || p.isDeleted) throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  if (p.status === "refunded") throw new AppError(httpStatus.BAD_REQUEST, "Payment is already fully refunded");

  const already = p.refunded_amount || 0;
  const remaining = +(p.amount - already).toFixed(2);
  let amount = Number(body.amount) || 0;
  if (!amount || amount <= 0) amount = remaining; // default: refund the full remaining amount
  if (amount > remaining + 0.01) {
    throw new AppError(httpStatus.BAD_REQUEST, `Refund exceeds the remaining refundable amount (${remaining})`);
  }

  if (p.stripe_payment_intent) {
    await stripe.refunds.create({
      payment_intent: p.stripe_payment_intent,
      amount: Math.round(amount * 100),
    });
  }

  p.refunded_amount = +(already + amount).toFixed(2);
  p.status = p.refunded_amount >= p.amount - 0.01 ? "refunded" : "partially_refunded";
  if (body.reason) p.refund_reason = String(body.reason);
  p.refunded_at = new Date();
  p.refunded_by = new Types.ObjectId(adminId);
  await p.save();
  return p;
};

// ── Super-admin team management ────────────────────────────────────────────

const listAdmins = async (currentId: string) => {
  const rows = (await UserModel.find({ role: "superadmin", isDeleted: { $ne: true } })
    .select("name email status createdAt created_by")
    .populate("created_by", "name email")
    .sort({ createdAt: 1 })
    .lean()) as any[];
  return rows.map((u) => ({
    _id: u._id,
    name: u.name || "—",
    email: u.email || "",
    status: u.status || "active",
    created_at: u.createdAt,
    added_by: u.created_by ? u.created_by.name || u.created_by.email : null,
    is_owner: !u.created_by,
    is_you: String(u._id) === String(currentId),
  }));
};

const createAdmin = async (body: Record<string, unknown>, currentId: string) => {
  const name = String(body.name || "").trim();
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");
  if (!name || !email || !password) {
    throw new AppError(httpStatus.BAD_REQUEST, "name, email and password are required");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Please provide a valid email address");
  }
  if (password.length < 6) {
    throw new AppError(httpStatus.BAD_REQUEST, "Password must be at least 6 characters");
  }
  const exists = await UserModel.findOne({ email });
  if (exists) throw new AppError(httpStatus.BAD_REQUEST, "A user with this email already exists");

  const admin = await UserModel.create({
    name,
    email,
    password, // hashed by the schema setter
    role: "superadmin",
    status: "active",
    active: true,
    login: true,
    authProvider: "local",
    created_by: new Types.ObjectId(currentId),
  });
  const obj = admin.toObject() as Record<string, unknown>;
  delete obj.password;
  return obj;
};

const removeAdmin = async (id: string, currentId: string) => {
  if (String(id) === String(currentId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "You cannot remove your own super admin account");
  }
  const admin = await UserModel.findOne({ _id: id, role: "superadmin", isDeleted: { $ne: true } });
  if (!admin) throw new AppError(httpStatus.NOT_FOUND, "Super admin not found");
  if (!admin.created_by) {
    throw new AppError(httpStatus.BAD_REQUEST, "A primary super admin cannot be removed");
  }
  const count = await UserModel.countDocuments({ role: "superadmin", isDeleted: { $ne: true } });
  if (count <= 1) throw new AppError(httpStatus.BAD_REQUEST, "Cannot remove the last super admin");

  admin.isDeleted = true;
  await admin.save();
  return { _id: admin._id };
};

export const superadminService = {
  overview,
  companies,
  companyDetail,
  users,
  subscriptions,
  assignSubscription,
  updateSubscription,
  impersonate,
  payments,
  refundPayment,
  listAdmins,
  createAdmin,
  removeAdmin,
};
