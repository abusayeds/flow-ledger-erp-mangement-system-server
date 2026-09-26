import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { companyScope, creatorId as creatorIdUtil } from "../../account/account.utils";
import { AuthRequest } from "../../../../middlewares/auth";
import { BudgetPeriodModel } from "../budgetPeriod/budgetPeriod.model";
import { TBudget } from "../budget.types";
import { BudgetModel } from "./budget.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const ensureActivePeriod = async (userId: string, periodId: Types.ObjectId) => {
  const period = await BudgetPeriodModel.findOne({
    _id: periodId,
    ...companyScope(userId),
    isDeleted: false,
  });
  if (!period) throw new AppError(httpStatus.BAD_REQUEST, "Budget period not found");
  if (period.status !== "active") {
    throw new AppError(httpStatus.BAD_REQUEST, "Budget can only be created in active periods");
  }
  return period;
};

const createDB = async (payload: TBudget) => {
  await ensureActivePeriod(payload.user_id.toString(), payload.period_id);
  return BudgetModel.create({
    ...payload,
    total_budget_amount: 0,
    status: "draft",
  });
};

const updateDB = async (id: string, userId: string, payload: Partial<TBudget>) => {
  const record = await BudgetModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Budget not found");
  if (record.status !== "draft") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only draft budgets can be edited");
  }
  if (payload.period_id) await ensureActivePeriod(userId, payload.period_id);
  Object.assign(record, payload);
  await record.save();
  return record;
};

const deleteDBOne = async (id: string, userId: string) => {
  const record = await BudgetModel.findOne({ _id: id, ...companyScope(userId), isDeleted: false });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Budget not found");
  if (record.status !== "draft") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only draft budgets can be deleted");
  }
  record.isDeleted = true;
  await record.save();
  return record;
};

const approveDB = async (id: string, userId: string, req: AuthRequest) => {
  const record = await BudgetModel.findOne({ _id: id, ...companyScope(userId), isDeleted: false });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Budget not found");
  if (record.status !== "draft") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only draft budgets can be approved");
  }
  record.status = "approved";
  record.approved_by = creatorIdUtil(req);
  await record.save();
  return record;
};

const activeDB = async (id: string, userId: string) => {
  const record = await BudgetModel.findOne({ _id: id, ...companyScope(userId), isDeleted: false });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Budget not found");
  if (record.status !== "approved") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only approved budgets can be activated");
  }
  record.status = "active";
  await record.save();
  return record;
};

const closeDB = async (id: string, userId: string) => {
  const record = await BudgetModel.findOne({ _id: id, ...companyScope(userId), isDeleted: false });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Budget not found");
  if (record.status !== "active") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only active budgets can be closed");
  }
  record.status = "closed";
  await record.save();
  return record;
};

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const base = BudgetModel.find({ ...companyScope(userId), isDeleted: false })
    .populate("period_id", "period_name financial_year status start_date end_date")
    .populate("approved_by", "name email");
  const build = new queryBuilder(base, query)
    .search(["budget_name"])
    .filter()
    .sort()
    .fields();
  const { totalData } = await build.paginate(BudgetModel.find({ ...companyScope(userId), isDeleted: false }));
  const rows = await build.modelQuery.exec();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  return { rows, pagination: build.calculatePagination({ totalData, currentPage: page, limit }) };
};

const listForAllocationDB = async (userId: string) =>
  BudgetModel.find({
    ...companyScope(userId),
    status: { $in: ["approved", "active"] },
    isDeleted: false,
  })
    .select("_id budget_name status period_id budget_type total_budget_amount")
    .populate("period_id", "period_name")
    .sort({ createdAt: -1 })
    .lean();

const deleteDB = withBulkDeleteId(deleteDBOne);

export const budgetService = {
  createDB,
  updateDB,
  deleteDB,
  approveDB,
  activeDB,
  closeDB,
  getAllDB,
  listForAllocationDB,
};
