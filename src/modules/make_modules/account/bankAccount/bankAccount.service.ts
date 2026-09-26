import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { companyScope } from "../account.utils";
import { TBankAccount } from "./bankAccount.interface";
import { BankAccountModel } from "./bankAccount.model";
import { ChartOfAccountModel } from "../chartOfAccount/chartOfAccount.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const assertGlAccount = async (userId: string, glAccountId?: string) => {
  if (!glAccountId) return;
  const coa = await ChartOfAccountModel.findOne({
    _id: glAccountId,
    ...companyScope(userId),
  });
  if (!coa) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid chart of account for bank account");
  }
};

const createDB = async (payload: TBankAccount) => {
  
  await assertGlAccount(String(payload.user_id), String(payload.gl_account_id));
  console.log("checking gl account");
  const exists = await BankAccountModel.findOne({
    user_id: payload.user_id,
    account_number: payload.account_number,
    isDeleted: false,
  });
  if (exists) {
    throw new AppError(httpStatus.CONFLICT, "Bank account number already exists");
  }
  if (payload.current_balance === undefined) {
    payload.current_balance = payload.opening_balance ?? 0;
  }
  return BankAccountModel.create(payload);
};

const updateDB = async (id: string, userId: string, payload: Partial<TBankAccount>) => {
  const record = await BankAccountModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Bank account not found");
  if (payload.gl_account_id) {
    await assertGlAccount(userId, String(payload.gl_account_id));
  }
  if (payload.account_number && payload.account_number !== record.account_number) {
    const dup = await BankAccountModel.findOne({
      user_id: userId,
      account_number: payload.account_number,
      _id: { $ne: id }
    });
    if (dup) throw new AppError(httpStatus.CONFLICT, "Bank account number already exists");
  }
  Object.assign(record, payload);
  await record.save();
  return record;
};

const deleteDBOne = async (id: string, userId: string) => {
  const record = await BankAccountModel.findOneAndUpdate(
    { _id: id, ...companyScope(userId) },
    { isDeleted: true },
    { new: true }
  );
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Bank account not found");
  return record;
};

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const base = BankAccountModel.find(companyScope(userId)).populate(
    "gl_account_id",
    "account_code account_name"
  );
  const build = new queryBuilder(base, query)
    .search(["account_number", "account_name", "bank_name"])
    .filter()
    .sort()
    .fields();
  const { totalData } = await build.paginate(BankAccountModel.find(companyScope(userId)));
  const rows = await build.modelQuery.exec();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  return { rows, pagination: build.calculatePagination({ totalData, currentPage: page, limit }) };
};

const listActiveDB = async (userId: string) =>
  BankAccountModel.find({ ...companyScope(userId), is_active: true })
    .select("_id account_name account_number current_balance")
    .lean();

const deleteDB = withBulkDeleteId(deleteDBOne);

export const bankAccountService = { createDB, updateDB, deleteDB, getAllDB, listActiveDB };
