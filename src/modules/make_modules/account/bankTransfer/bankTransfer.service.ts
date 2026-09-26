import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import {
  companyObjectId,
  companyScope,
  generateAccountNumber,
} from "../account.utils";
import { TBankTransfer } from "./bankTransfer.interface";
import { BankTransferModel } from "./bankTransfer.model";
import { BankAccountModel } from "../bankAccount/bankAccount.model";
import { createBankTransaction } from "../accountBank.service";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const assertAccounts = async (
  userId: string,
  fromId: string,
  toId: string
) => {
  if (fromId === toId) {
    throw new AppError(httpStatus.BAD_REQUEST, "From and to accounts must be different");
  }
  const from = await BankAccountModel.findOne({ _id: fromId, ...companyScope(userId) });
  const to = await BankAccountModel.findOne({ _id: toId, ...companyScope(userId) });
  if (!from || !to) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid bank account for transfer");
  }
};

const createDB = async (payload: TBankTransfer) => {
  await assertAccounts(
    String(payload.user_id),
    String(payload.from_account_id),
    String(payload.to_account_id)
  );
  payload.transfer_number = await generateAccountNumber(
    BankTransferModel,
    "BT",
    companyObjectId(payload.user_id),
    "transfer_number"
  );
  payload.status = "pending";
  return BankTransferModel.create(payload);
};

const updateDB = async (id: string, userId: string, payload: Partial<TBankTransfer>) => {
  const record = await BankTransferModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Bank transfer not found");
  if (record.status !== "pending") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only pending transfers can be updated");
  }
  const fromId = String(payload.from_account_id ?? record.from_account_id);
  const toId = String(payload.to_account_id ?? record.to_account_id);
  await assertAccounts(userId, fromId, toId);
  Object.assign(record, payload);
  await record.save();
  return record;
};

const deleteDBOne = async (id: string, userId: string) => {
  const record = await BankTransferModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Bank transfer not found");
  if (record.status !== "pending") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only pending transfers can be deleted");
  }
  record.isDeleted = true;
  await record.save();
  return record;
};

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const base = BankTransferModel.find(companyScope(userId))
    .populate("from_account_id", "account_name account_number")
    .populate("to_account_id", "account_name account_number");
  const build = new queryBuilder(base, query)
    .search(["transfer_number", "reference_number", "description"])
    .filter()
    .sort()
    .fields();
  const { totalData } = await build.paginate(BankTransferModel.find(companyScope(userId)));
  const rows = await build.modelQuery.exec();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  return { rows, pagination: build.calculatePagination({ totalData, currentPage: page, limit }) };
};

const processDB = async (id: string, userId: string) => {
  const record = await BankTransferModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Bank transfer not found");
  if (record.status !== "pending") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only pending transfers can be processed");
  }

  const totalDebit = record.transfer_amount + (record.transfer_charges ?? 0);

  await createBankTransaction({
    user_id: record.user_id,
    creator_id: record.creator_id,
    bank_account_id: record.from_account_id,
    transaction_date: record.transfer_date,
    transaction_type: "debit",
    reference_number: record.transfer_number,
    description: record.description,
    amount: totalDebit,
    running_balance: 0,
    transaction_status: "cleared",
    reconciliation_status: "unreconciled",
  });

  await createBankTransaction({
    user_id: record.user_id,
    creator_id: record.creator_id,
    bank_account_id: record.to_account_id,
    transaction_date: record.transfer_date,
    transaction_type: "credit",
    reference_number: record.transfer_number,
    description: record.description,
    amount: record.transfer_amount,
    running_balance: 0,
    transaction_status: "cleared",
    reconciliation_status: "unreconciled",
  });

  record.status = "completed";
  await record.save();
  return record;
};

const deleteDB = withBulkDeleteId(deleteDBOne);

export const bankTransferService = { createDB, updateDB, deleteDB, getAllDB, processDB };
