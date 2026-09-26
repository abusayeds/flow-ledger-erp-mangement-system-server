import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { MODULE_KEYS } from "../subscription.constants";
import { PlanModel } from "./plan.model";
import { TPlan } from "./plan.interface";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toPlainLimits = (limits: any): Record<string, number> => {
  if (!limits) return {};
  if (limits instanceof Map) return Object.fromEntries(limits);
  return limits as Record<string, number>;
};

const format = (p: any) => ({
  _id: p._id,
  name: p.name,
  description: p.description ?? null,
  price_monthly: p.price_monthly,
  price_yearly: p.price_yearly,
  free_plan: p.free_plan,
  trial: p.trial,
  trial_days: p.trial_days,
  status: p.status,
  number_of_users: p.number_of_users,
  modules: p.modules ?? [],
  limits: toPlainLimits(p.limits),
  createdAt: p.createdAt,
});


const sanitize = (payload: Record<string, unknown>) => {
  const out = { ...payload };
  if (out.modules !== undefined) {
    if (!Array.isArray(out.modules)) {
      throw new AppError(httpStatus.BAD_REQUEST, "modules must be an array.");
    }
    const invalid = (out.modules as string[]).filter((m) => !MODULE_KEYS.includes(m));
    if (invalid.length > 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Invalid module(s): ${invalid.join(", ")}. Allowed: ${MODULE_KEYS.join(", ")}`
      );
    }
  }
  // Single user cap (number_of_users) only — ignore any per-resource limits sent.
  delete out.limits;
  return out;
};

const createPlanDB = async (payload: Record<string, unknown>, creatorId?: string) => {
  const doc = await PlanModel.create({
    ...sanitize(payload),
    created_by: creatorId ? new Types.ObjectId(creatorId) : undefined,
    isDeleted: false,
  });
  return format(doc);
};

const getAllPlansDB = async (query: Record<string, unknown>) => {
  const base = { isDeleted: false };
  const qb = new queryBuilder(PlanModel.find(base), query)
    .search(["name", "description"] as never)
    .filter()
    .sort()
    .fields();
  const { totalData } = await qb.paginate(PlanModel.find(base));
  const rows = await qb.modelQuery.lean().exec();
  const data = rows.map(format);
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query?.limit) || 10;
  const pagination = qb.calculatePagination({ totalData, currentPage, limit });
  return { data, pagination };
};

const getSinglePlanDB = async (id: string) => {
  const plan = await PlanModel.findOne({ _id: id, isDeleted: false }).lean();
  if (!plan) throw new AppError(httpStatus.NOT_FOUND, "Plan not found");
  return format(plan);
};

const updatePlanDB = async (id: string, payload: Record<string, unknown>) => {
  const clean = sanitize(payload);
  delete (clean as Partial<TPlan>).created_by;
  const plan = await PlanModel.findOneAndUpdate(
    { _id: id },
    { $set: clean },
    { new: true, runValidators: true }
  ).lean();
  if (!plan) throw new AppError(httpStatus.NOT_FOUND, "Plan not found");
  return format(plan);
};

const deletePlanDBOne = async (id: string) => {
  const plan = await PlanModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!plan) throw new AppError(httpStatus.NOT_FOUND, "Plan not found");
  return { _id: id };
};

const deletePlanDB = withBulkDeleteId(deletePlanDBOne);

export const planService = {
  createPlanDB,
  getAllPlansDB,
  getSinglePlanDB,
  updatePlanDB,
  deletePlanDB,
};
