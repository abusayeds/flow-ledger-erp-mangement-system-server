import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { companyScope, creatorId as creatorIdUtil } from "../../account/account.utils";
import { AuthRequest } from "../../../../middlewares/auth";
import { BudgetModel } from "../budgets/budget.model";
import { TBudgetPeriod } from "../budget.types";
import { BudgetPeriodModel } from "./budgetPeriod.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const assertDates = (start: Date, end: Date) => {
  if (new Date(end) <= new Date(start)) {
    throw new AppError(httpStatus.BAD_REQUEST, "End date must be after start date");
  }
};

const createDB = async (payload: TBudgetPeriod) => {
  assertDates(payload.start_date, payload.end_date);
  return BudgetPeriodModel.create({ ...payload, status: "draft" });
};

const updateDB = async (id: string, userId: string, payload: Partial<TBudgetPeriod>) => {
  const record = await BudgetPeriodModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Budget period not found");
  const start = payload.start_date ?? record.start_date;
  const end = payload.end_date ?? record.end_date;
  assertDates(start, end);
  Object.assign(record, payload);
  await record.save();
  return record;
};

const deleteDBOne = async (id: string, userId: string) => {
  const record = await BudgetPeriodModel.findOneAndUpdate(
    { _id: id, ...companyScope(userId) },
    { isDeleted: true },
    { new: true }
  );
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Budget period not found");
  return record;
};

const approveDB = async (id: string, userId: string, req: AuthRequest) => {
  const record = await BudgetPeriodModel.findOne({ _id: id, ...companyScope(userId), isDeleted: false });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Budget period not found");
  if (record.status !== "draft") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only draft budget periods can be approved");
  }
  record.status = "approved";
  record.approved_by = creatorIdUtil(req);
  await record.save();
  return record;
};

const activeDB = async (id: string, userId: string) => {
  const record = await BudgetPeriodModel.findOne({ _id: id, ...companyScope(userId), isDeleted: false });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Budget period not found");
  if (record.status !== "approved") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only approved budget periods can be activated");
  }
  record.status = "active";
  await record.save();
  return record;
};

const closeDB = async (id: string, userId: string) => {
  const record = await BudgetPeriodModel.findOne({ _id: id, ...companyScope(userId), isDeleted: false });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Budget period not found");
  if (record.status !== "active") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only active budget periods can be closed");
  }
  record.status = "closed";
  await record.save();
  await BudgetModel.updateMany(
    { period_id: record._id, ...companyScope(userId), isDeleted: false },
    { status: "closed" }
  );
  return record;
};

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const base = BudgetPeriodModel.find({ ...companyScope(userId), isDeleted: false })
    .populate("approved_by", "name email");
  const build = new queryBuilder(base, query)
    .search(["period_name", "financial_year"])
    .filter()
    .sort()
    .fields();
  const { totalData } = await build.paginate(
    BudgetPeriodModel.find({ ...companyScope(userId), isDeleted: false })
  );
  const rows = await build.modelQuery.exec();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  return { rows, pagination: build.calculatePagination({ totalData, currentPage: page, limit }) };
};

const listActiveDB = async (userId: string) =>
  BudgetPeriodModel.find({ ...companyScope(userId), status: "active", isDeleted: false })
    .select("_id period_name financial_year start_date end_date status")
    .sort({ start_date: -1 })
    .lean();

const deleteDB = withBulkDeleteId(deleteDBOne);

export const budgetPeriodService = {
  createDB,
  updateDB,
  deleteDB,
  approveDB,
  activeDB,
  closeDB,
  getAllDB,
  listActiveDB,
};
