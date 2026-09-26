import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import {
  companyObjectId,
  companyScope,
  creatorId as creatorIdUtil,
  generateAccountNumber,
} from "../account.utils";
import { TAccountRevenue } from "./accountRevenue.interface";
import { AccountRevenueModel } from "./accountRevenue.model";
import { RevenueCategoryModel } from "../revenueCategory/revenueCategory.model";
import { BankAccountModel } from "../bankAccount/bankAccount.model";
import { ChartOfAccountModel } from "../chartOfAccount/chartOfAccount.model";
import { createBankTransaction } from "../accountBank.service";
import { AuthRequest } from "../../../../middlewares/auth";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const assertRefs = async (userId: string, payload: Partial<TAccountRevenue>) => {
  if (payload.category_id) {
    const cat = await RevenueCategoryModel.findOne({
      _id: payload.category_id,
      ...companyScope(userId),
    });
    if (!cat) throw new AppError(httpStatus.BAD_REQUEST, "Invalid revenue category");
  }
  if (payload.bank_account_id) {
    const bank = await BankAccountModel.findOne({
      _id: payload.bank_account_id,
      ...companyScope(userId),
    });
    if (!bank) throw new AppError(httpStatus.BAD_REQUEST, "Invalid bank account");
  }
  if (payload.chart_of_account_id) {
    const coa = await ChartOfAccountModel.findOne({
      _id: payload.chart_of_account_id,
      ...companyScope(userId),
    });
    if (!coa) throw new AppError(httpStatus.BAD_REQUEST, "Invalid chart of account");
  }
};

const createDB = async (payload: TAccountRevenue) => {
  await assertRefs(String(payload.user_id), payload);
  payload.revenue_number = await generateAccountNumber(
    AccountRevenueModel,
    "REV",
    companyObjectId(payload.user_id),
    "revenue_number"
  );
  payload.status = "draft";
  return AccountRevenueModel.create(payload);
};

const updateDB = async (id: string, userId: string, payload: Partial<TAccountRevenue>) => {
  const record = await AccountRevenueModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Revenue not found");
  if (record.status !== "draft") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only draft revenues can be updated");
  }
  await assertRefs(userId, payload);
  Object.assign(record, payload);
  await record.save();
  return record;
};

const deleteDBOne = async (id: string, userId: string) => {
  const record = await AccountRevenueModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Revenue not found");
  if (record.status !== "draft") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only draft revenues can be deleted");
  }
  record.isDeleted = true;
  await record.save();
  return record;
};

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const base = AccountRevenueModel.find(companyScope(userId))
    .populate("category_id", "category_name category_code")
    .populate("bank_account_id", "account_name account_number")
    .populate("chart_of_account_id", "account_code account_name");
  const build = new queryBuilder(base, query)
    .search(["revenue_number", "description", "reference_number"])
    .filter()
    .sort()
    .fields();
  const { totalData } = await build.paginate(AccountRevenueModel.find(companyScope(userId)));
  const rows = await build.modelQuery.exec();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  return { rows, pagination: build.calculatePagination({ totalData, currentPage: page, limit }) };
};

const approveDB = async (id: string, userId: string, req: AuthRequest) => {
  const record = await AccountRevenueModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Revenue not found");
  if (record.status !== "draft") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only draft revenues can be approved");
  }
  record.status = "approved";
  record.approved_by = creatorIdUtil(req);
  await record.save();
  return record;
};

const postDB = async (id: string, userId: string) => {
  const record = await AccountRevenueModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Revenue not found");
  if (record.status === "posted") {
    throw new AppError(httpStatus.BAD_REQUEST, "Revenue is already posted");
  }
  if (record.status === "draft") {
    throw new AppError(httpStatus.BAD_REQUEST, "Revenue must be approved before posting");
  }
  await createBankTransaction({
    user_id: record.user_id,
    creator_id: record.creator_id,
    bank_account_id: record.bank_account_id,
    transaction_date: record.revenue_date,
    transaction_type: "credit",
    reference_number: record.revenue_number,
    description: record.description ?? `Revenue ${record.revenue_number}`,
    amount: record.amount,
    running_balance: 0,
    transaction_status: "cleared",
    reconciliation_status: "unreconciled",
  });
  record.status = "posted";
  await record.save();

  const { createRevenueEntryJournal } = await import("../journal/journal.service");
  const journal = await createRevenueEntryJournal(userId, record.creator_id, {
    _id: record._id!,
    revenue_number: record.revenue_number!,
    revenue_date: record.revenue_date,
    amount: record.amount,
    bank_account_id: record.bank_account_id,
    chart_of_account_id: record.chart_of_account_id,
  });

  const { tryAutoContributeFromCoaMovement } = await import("../../goal/goal.core.service");
  await tryAutoContributeFromCoaMovement(userId, record.creator_id, {
    accountId: record.chart_of_account_id,
    movementDate: record.revenue_date,
    debitAmount: 0,
    creditAmount: record.amount,
    referenceType: "bank_transaction",
    referenceId: record._id,
    notes: `Auto-contribution from revenue ${record.revenue_number}`,
  });

  const { tryUpdateBudgetSpendingForAccount } = await import("../../budgetPlanner/budget.core.service");
  await tryUpdateBudgetSpendingForAccount(userId, record.chart_of_account_id, record.creator_id);
  if (journal) {
    const bank = await import("../bankAccount/bankAccount.model").then((m) =>
      m.BankAccountModel.findById(record.bank_account_id).select("gl_account_id").lean()
    );
    if (bank?.gl_account_id) {
      await tryUpdateBudgetSpendingForAccount(userId, bank.gl_account_id, record.creator_id);
    }
  }

  return record;
};

const deleteDB = withBulkDeleteId(deleteDBOne);

export const accountRevenueService = {
  createDB,
  updateDB,
  deleteDB,
  getAllDB,
  approveDB,
  postDB,
};
