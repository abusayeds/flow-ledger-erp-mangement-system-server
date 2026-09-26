import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { companyScope } from "../account.utils";
import { TAccountCategory } from "./accountCategory.interface";
import { AccountCategoryModel } from "./accountCategory.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const createDB = async (payload: TAccountCategory) => {
  const exists = await AccountCategoryModel.findOne({
    user_id: payload.user_id,
    code: payload.code,
    isDeleted: false,
  });
  if (exists) {
    throw new AppError(httpStatus.CONFLICT, "Account category code already exists");
  }
  return AccountCategoryModel.create(payload);
};

const updateDB = async (id: string, userId: string, payload: Partial<TAccountCategory>) => {
  const record = await AccountCategoryModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Account category not found");
  if (payload.code && payload.code !== record.code) {
    const dup = await AccountCategoryModel.findOne({
      user_id: userId,
      code: payload.code,
      _id: { $ne: id }
    });
    if (dup) throw new AppError(httpStatus.CONFLICT, "Account category code already exists");
  }
  Object.assign(record, payload);
  await record.save();
  return record;
};

const deleteDBOne = async (id: string, userId: string) => {
  const record = await AccountCategoryModel.findOneAndUpdate(
    { _id: id, ...companyScope(userId) },
    { isDeleted: true },
    { new: true }
  );
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Account category not found");
  return record;
};

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const base = AccountCategoryModel.find(companyScope(userId));
  const build = new queryBuilder(base, query)
    .search(["name", "code", "type", "description"])
    .filter()
    .sort()
    .fields();
  const { totalData } = await build.paginate(AccountCategoryModel.find(companyScope(userId)));
  const rows = await build.modelQuery.exec();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  return { rows, pagination: build.calculatePagination({ totalData, currentPage: page, limit }) };
};

const listActiveDB = async (userId: string) =>
  AccountCategoryModel.find({ ...companyScope(userId), is_active: true })
    .select("_id name code type")
    .sort({ name: 1 })
    .lean();

const deleteDB = withBulkDeleteId(deleteDBOne);

export const accountCategoryService = { createDB, updateDB, deleteDB, getAllDB, listActiveDB };
