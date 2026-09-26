import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { companyScope } from "../account.utils";
import { TChartOfAccount } from "./chartOfAccount.interface";
import { ChartOfAccountModel } from "./chartOfAccount.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const resolveLevel = async (
  userId: string,
  parentAccountId?: string
): Promise<number> => {
  if (!parentAccountId) return 1;
  const parent = await ChartOfAccountModel.findOne({
    _id: parentAccountId,
    ...companyScope(userId),
  });
  if (!parent) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid parent account");
  }
  return (parent.level ?? 1) + 1;
};

const createDB = async (payload: TChartOfAccount) => {
  const exists = await ChartOfAccountModel.findOne({
    user_id: payload.user_id,
    account_code: payload.account_code,
    isDeleted: false,
  });
  if (exists) {
    throw new AppError(httpStatus.CONFLICT, "Account code already exists");
  }
  payload.level = await resolveLevel(String(payload.user_id), payload.parent_account_id?.toString());
  if (payload.current_balance === undefined) {
    payload.current_balance = payload.opening_balance ?? 0;
  }
  return ChartOfAccountModel.create(payload);
};

const updateDB = async (id: string, userId: string, payload: Partial<TChartOfAccount>) => {
  const record = await ChartOfAccountModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Chart of account not found");
  if (record.is_system_account && payload.account_code && payload.account_code !== record.account_code) {
    throw new AppError(httpStatus.BAD_REQUEST, "System account code cannot be changed");
  }
  if (payload.parent_account_id !== undefined) {
    payload.level = await resolveLevel(userId, payload.parent_account_id?.toString());
  }
  if (
    payload.account_code &&
    payload.account_code !== record.account_code &&
    !record.is_system_account
  ) {
    const dup = await ChartOfAccountModel.findOne({
      user_id: userId,
      account_code: payload.account_code,
      _id: { $ne: id }
    });
    if (dup) throw new AppError(httpStatus.CONFLICT, "Account code already exists");
  }
  if (record.is_system_account) {
    delete payload.account_code;
  }
  Object.assign(record, payload);
  await record.save();
  return record;
};

const deleteDBOne = async (id: string, userId: string) => {
  const record = await ChartOfAccountModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Chart of account not found");
  if (record.is_system_account) {
    throw new AppError(httpStatus.BAD_REQUEST, "System accounts cannot be deleted");
  }
  record.isDeleted = true;
  await record.save();
  return record;
};

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const base = ChartOfAccountModel.find(companyScope(userId))
    .populate("account_type_id", "name code")
    .populate("parent_account_id", "account_code account_name");
  const build = new queryBuilder(base, query)
    .search(["account_code", "account_name", "description"])
    .filter()
    .sort()
    .fields();
  const { totalData } = await build.paginate(ChartOfAccountModel.find(companyScope(userId)));
  const rows = await build.modelQuery.exec();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  return { rows, pagination: build.calculatePagination({ totalData, currentPage: page, limit }) };
};

const getSingleDB = async (id: string, userId: string) => {
  const record = await ChartOfAccountModel.findOne({ _id: id, ...companyScope(userId) })
    .populate("account_type_id", "name code normal_balance")
    .populate("parent_account_id", "account_code account_name level");
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Chart of account not found");
  const doc = record.toObject();
  return {
    ...doc,
    balance: doc.current_balance ?? 0,
  };
};

const deleteDB = withBulkDeleteId(deleteDBOne);

export const chartOfAccountService = { createDB, updateDB, deleteDB, getAllDB, getSingleDB };
