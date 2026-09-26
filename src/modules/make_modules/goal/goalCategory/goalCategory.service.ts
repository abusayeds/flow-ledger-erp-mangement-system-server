import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { companyScope } from "../../account/account.utils";
import { TGoalCategory } from "../goal.types";
import { GoalCategoryModel } from "./goalCategory.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const createDB = async (payload: TGoalCategory) => {
  const exists = await GoalCategoryModel.findOne({
    user_id: payload.user_id,
    category_code: payload.category_code,
    isDeleted: false,
  });
  if (exists) {
    throw new AppError(httpStatus.CONFLICT, "Goal category code already exists");
  }
  return GoalCategoryModel.create(payload);
};

const updateDB = async (id: string, userId: string, payload: Partial<TGoalCategory>) => {
  const record = await GoalCategoryModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Goal category not found");
  if (payload.category_code && payload.category_code !== record.category_code) {
    const dup = await GoalCategoryModel.findOne({
      user_id: userId,
      category_code: payload.category_code,
      _id: { $ne: id }
    });
    if (dup) throw new AppError(httpStatus.CONFLICT, "Goal category code already exists");
  }
  Object.assign(record, payload);
  await record.save();
  return record;
};

const deleteDBOne = async (id: string, userId: string) => {
  const record = await GoalCategoryModel.findOneAndUpdate(
    { _id: id, ...companyScope(userId) },
    { isDeleted: true },
    { new: true }
  );
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Goal category not found");
  return record;
};

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const base = GoalCategoryModel.find({ ...companyScope(userId), isDeleted: false });
  const build = new queryBuilder(base, query)
    .search(["category_name", "category_code", "description"])
    .filter()
    .sort()
    .fields();
  const { totalData } = await build.paginate(
    GoalCategoryModel.find({ ...companyScope(userId), isDeleted: false })
  );
  const rows = await build.modelQuery.exec();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  return { rows, pagination: build.calculatePagination({ totalData, currentPage: page, limit }) };
};

const deleteDB = withBulkDeleteId(deleteDBOne);

export const goalCategoryService = { createDB, updateDB, deleteDB, getAllDB };
