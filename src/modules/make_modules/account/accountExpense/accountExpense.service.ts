import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import {
  companyObjectId,
  companyScope,
  creatorId as creatorIdUtil,
  generateAccountNumber,
} from "../account.utils";
import { TAccountExpense } from "./accountExpense.interface";
import { AccountExpenseModel } from "./accountExpense.model";
import { ExpenseCategoryModel } from "../expenseCategory/expenseCategory.model";
import { BankAccountModel } from "../bankAccount/bankAccount.model";
import { ChartOfAccountModel } from "../chartOfAccount/chartOfAccount.model";
import { createBankTransaction } from "../accountBank.service";
import { AuthRequest } from "../../../../middlewares/auth";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const assertRefs = async (userId: string, payload: Partial<TAccountExpense>) => {
  if (payload.category_id) {
    const cat = await ExpenseCategoryModel.findOne({
      _id: payload.category_id,
      ...companyScope(userId),
    });
    if (!cat) throw new AppError(httpStatus.BAD_REQUEST, "Invalid expense category");
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

const createDB = async (payload: TAccountExpense) => {
  await assertRefs(String(payload.user_id), payload);
  payload.expense_number = await generateAccountNumber(
    AccountExpenseModel,
    "EXP",
    companyObjectId(payload.user_id),
    "expense_number"
  );
  payload.status = "draft";
  return AccountExpenseModel.create(payload);
};

const updateDB = async (id: string, userId: string, payload: Partial<TAccountExpense>) => {
  const record = await AccountExpenseModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Expense not found");
  if (record.status !== "draft") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only draft expenses can be updated");
  }
  await assertRefs(userId, payload);
  Object.assign(record, payload);
  await record.save();
  return record;
};

const deleteDBOne = async (id: string, userId: string) => {
  const record = await AccountExpenseModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Expense not found");
  if (record.status !== "draft") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only draft expenses can be deleted");
  }
  record.isDeleted = true;
  await record.save();
  return record;
};

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const base = AccountExpenseModel.find(companyScope(userId))
    .populate("category_id", "category_name category_code")
    .populate("bank_account_id", "account_name account_number")
    .populate("chart_of_account_id", "account_code account_name");
  const build = new queryBuilder(base, query)
    .search(["expense_number", "description", "reference_number"])
    .filter()
    .sort()
    .fields();
  const { totalData } = await build.paginate(AccountExpenseModel.find(companyScope(userId)));
  const rows = await build.modelQuery.exec();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  return { rows, pagination: build.calculatePagination({ totalData, currentPage: page, limit }) };
};

const approveDB = async (id: string, userId: string, req: AuthRequest) => {
  const record = await AccountExpenseModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Expense not found");
  if (record.status !== "draft") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only draft expenses can be approved");
  }
  record.status = "approved";
  record.approved_by = creatorIdUtil(req);
  await record.save();
  return record;
};

const postDB = async (id: string, userId: string) => {
  const record = await AccountExpenseModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Expense not found");
  if (record.status === "posted") {
    throw new AppError(httpStatus.BAD_REQUEST, "Expense is already posted");
  }
  if (record.status === "draft") {
    throw new AppError(httpStatus.BAD_REQUEST, "Expense must be approved before posting");
  }
  await createBankTransaction({
    user_id: record.user_id,
    creator_id: record.creator_id,
    bank_account_id: record.bank_account_id,
    transaction_date: record.expense_date,
    transaction_type: "debit",
    reference_number: record.expense_number,
    description: record.description ?? `Expense ${record.expense_number}`,
    amount: record.amount,
    running_balance: 0,
    transaction_status: "cleared",
    reconciliation_status: "unreconciled",
  });
  record.status = "posted";
  await record.save();

  const { createExpenseEntryJournal } = await import("../journal/journal.service");
  const journal = await createExpenseEntryJournal(userId, record.creator_id, {
    _id: record._id!,
    expense_number: record.expense_number!,
    expense_date: record.expense_date,
    amount: record.amount,
    bank_account_id: record.bank_account_id,
    chart_of_account_id: record.chart_of_account_id,
  });

  const { tryAutoContributeFromCoaMovement } = await import("../../goal/goal.core.service");
  await tryAutoContributeFromCoaMovement(userId, record.creator_id, {
    accountId: record.chart_of_account_id,
    movementDate: record.expense_date,
    debitAmount: record.amount,
    creditAmount: 0,
    referenceType: "bank_transaction",
    referenceId: record._id,
    notes: `Auto-contribution from expense ${record.expense_number}`,
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

export const accountExpenseService = {
  createDB,
  updateDB,
  deleteDB,
  getAllDB,
  approveDB,
  postDB,
};
