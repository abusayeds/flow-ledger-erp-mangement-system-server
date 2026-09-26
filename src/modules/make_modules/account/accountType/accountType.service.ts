import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { companyObjectId, companyScope, parseNormalBalance } from "../account.utils";
import { TAccountType } from "./accountType.interface";
import { AccountTypeModel } from "./accountType.model";
import { AccountCategoryModel } from "../accountCategory/accountCategory.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const assertCategory = async (userId: string, categoryId: string) => {
  const cat = await AccountCategoryModel.findOne({
    _id: categoryId,
    ...companyScope(userId),
  });
  if (!cat) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid account category");
  }
};

const createDB = async (payload: TAccountType) => {
  await assertCategory(String(payload.user_id), String(payload.category_id));
  const exists = await AccountTypeModel.findOne({
    user_id: payload.user_id,
    code: payload.code,
    isDeleted: false,
  });
  if (exists) {
    throw new AppError(httpStatus.CONFLICT, "Account type code already exists");
  }
  return AccountTypeModel.create(payload);
};

const updateDB = async (id: string, userId: string, payload: Partial<TAccountType>) => {
  const record = await AccountTypeModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Account type not found");
  if (record.is_system_type) {
    throw new AppError(httpStatus.BAD_REQUEST, "System account types cannot be modified");
  }
  if (payload.category_id) {
    await assertCategory(userId, String(payload.category_id));
  }
  if (payload.code && payload.code !== record.code) {
    const dup = await AccountTypeModel.findOne({
      user_id: companyObjectId(userId),
      code: payload.code,
      _id: { $ne: id }
    });
    if (dup) throw new AppError(httpStatus.CONFLICT, "Account type code already exists");
  }
  Object.assign(record, payload);
  await record.save();
  return record;
};

const deleteDBOne = async (id: string, userId: string) => {
  const record = await AccountTypeModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Account type not found");
  if (record.is_system_type) {
    throw new AppError(httpStatus.BAD_REQUEST, "System account types cannot be deleted");
  }
  record.isDeleted = true;
  await record.save();
  return record;
};

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const base = AccountTypeModel.find(companyScope(userId)).populate(
    "category_id",
    "name code"
  );
  const build = new queryBuilder(base, query)
    .search(["name", "code", "description"])
    .filter()
    .sort()
    .fields();
  const { totalData } = await build.paginate(AccountTypeModel.find(companyScope(userId)));
  const rows = await build.modelQuery.exec();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  return { rows, pagination: build.calculatePagination({ totalData, currentPage: page, limit }) };
};

const deleteDB = withBulkDeleteId(deleteDBOne);

export const accountTypeService = { createDB, updateDB, deleteDB, getAllDB };
