import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { companyScope } from "../account.utils";
import { TRevenueCategory } from "./revenueCategory.interface";
import { RevenueCategoryModel } from "./revenueCategory.model";
import { ChartOfAccountModel } from "../chartOfAccount/chartOfAccount.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const assertGlAccount = async (userId: string, glAccountId?: string) => {
  if (!glAccountId) return;
  const coa = await ChartOfAccountModel.findOne({ _id: glAccountId, ...companyScope(userId) });
  if (!coa) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid chart of account for revenue category");
  }
};

const createDB = async (payload: TRevenueCategory) => {
  await assertGlAccount(String(payload.user_id), payload.gl_account_id?.toString());
  const exists = await RevenueCategoryModel.findOne({
    user_id: payload.user_id,
    category_code: payload.category_code,
    isDeleted: false,
  });
  if (exists) {
    throw new AppError(httpStatus.CONFLICT, "Revenue category code already exists");
  }
  return RevenueCategoryModel.create(payload);
};

const updateDB = async (id: string, userId: string, payload: Partial<TRevenueCategory>) => {
  const record = await RevenueCategoryModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Revenue category not found");
  if (payload.gl_account_id) {
    await assertGlAccount(userId, String(payload.gl_account_id));
  }
  if (payload.category_code && payload.category_code !== record.category_code) {
    const dup = await RevenueCategoryModel.findOne({
      user_id: userId,
      category_code: payload.category_code,
      _id: { $ne: id }
    });
    if (dup) throw new AppError(httpStatus.CONFLICT, "Revenue category code already exists");
  }
  Object.assign(record, payload);
  await record.save();
  return record;
};

const deleteDBOne = async (id: string, userId: string) => {
  const record = await RevenueCategoryModel.findOneAndUpdate(
    { _id: id, ...companyScope(userId) },
    { isDeleted: true },
    { new: true }
  );
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Revenue category not found");
  return record;
};

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const base = RevenueCategoryModel.find(companyScope(userId)).populate(
    "gl_account_id",
    "account_code account_name"
  );
  const build = new queryBuilder(base, query)
    .search(["category_name", "category_code", "description"])
    .filter()
    .sort()
    .fields();
  const { totalData } = await build.paginate(RevenueCategoryModel.find(companyScope(userId)));
  const rows = await build.modelQuery.exec();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  return { rows, pagination: build.calculatePagination({ totalData, currentPage: page, limit }) };
};

const deleteDB = withBulkDeleteId(deleteDBOne);

export const revenueCategoryService = { createDB, updateDB, deleteDB, getAllDB };
