import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { companyScope } from "../../account/account.utils";
import { updateGoalTracking, validateGoalAccount } from "../goal.core.service";
import { TGoal } from "../goal.types";
import { GoalCategoryModel } from "../goalCategory/goalCategory.model";
import { GoalModel } from "./goal.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const ensureCategory = async (userId: string, categoryId: Types.ObjectId) => {
  const cat = await GoalCategoryModel.findOne({
    _id: categoryId,
    ...companyScope(userId),
    isDeleted: false,
  });
  if (!cat) throw new AppError(httpStatus.BAD_REQUEST, "Goal category not found");
};

const createDB = async (payload: TGoal) => {
  await ensureCategory(payload.user_id.toString(), payload.category_id);
  await validateGoalAccount(payload.user_id.toString(), payload.account_id);
  if (new Date(payload.target_date) <= new Date(payload.start_date)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Target date must be after start date");
  }
  const goal = await GoalModel.create({
    ...payload,
    current_amount: 0,
    status: "draft",
  });
  await updateGoalTracking(goal._id.toString(), payload.user_id.toString(), payload.creator_id);
  return goal;
};

const updateDB = async (id: string, userId: string, payload: Partial<TGoal>) => {
  const record = await GoalModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Goal not found");
  if (payload.category_id) await ensureCategory(userId, payload.category_id);
  if (payload.account_id !== undefined) {
    await validateGoalAccount(userId, payload.account_id);
  }
  const start = payload.start_date ?? record.start_date;
  const target = payload.target_date ?? record.target_date;
  if (new Date(target) <= new Date(start)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Target date must be after start date");
  }
  Object.assign(record, payload);
  await record.save();
  return record;
};

const activateDB = async (id: string, userId: string) => {
  const record = await GoalModel.findOne({ _id: id, ...companyScope(userId), isDeleted: false });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Goal not found");
  if (record.status !== "draft") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only draft goals can be activated");
  }
  record.status = "active";
  await record.save();
  return record;
};

const deleteDBOne = async (id: string, userId: string) => {
  const record = await GoalModel.findOneAndUpdate(
    { _id: id, ...companyScope(userId) },
    { isDeleted: true },
    { new: true }
  );
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Goal not found");
  return record;
};

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const base = GoalModel.find({ ...companyScope(userId), isDeleted: false })
    .populate("category_id", "category_name category_code")
    .populate("account_id", "account_code account_name normal_balance");
  const build = new queryBuilder(base, query)
    .search(["goal_name", "goal_description"])
    .filter()
    .sort()
    .fields();
  const { totalData } = await build.paginate(
    GoalModel.find({ ...companyScope(userId), isDeleted: false })
  );
  const rows = await build.modelQuery.exec();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  return { rows, pagination: build.calculatePagination({ totalData, currentPage: page, limit }) };
};

const getSingleDB = async (id: string, userId: string) => {
  const record = await GoalModel.findOne({ _id: id, ...companyScope(userId), isDeleted: false })
    .populate("category_id", "category_name category_code description")
    .populate("account_id", "account_code account_name normal_balance");
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Goal not found");
  return record;
};

const deleteDB = withBulkDeleteId(deleteDBOne);

export const goalService = {
  createDB,
  updateDB,
  activateDB,
  deleteDB,
  getAllDB,
  getSingleDB,
};
