import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { companyScope } from "../../account/account.utils";
import { ChartOfAccountModel } from "../../account/chartOfAccount/chartOfAccount.model";
import { recalculateBudgetTotal } from "../budget.core.service";
import { BudgetModel } from "../budgets/budget.model";
import { TBudgetAllocation } from "../budget.types";
import { BudgetAllocationModel } from "./budgetAllocation.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const ensureBudget = async (userId: string, budgetId: Types.ObjectId) => {
  const budget = await BudgetModel.findOne({ _id: budgetId, ...companyScope(userId), isDeleted: false });
  if (!budget) throw new AppError(httpStatus.BAD_REQUEST, "Budget not found");
  return budget;
};

const ensureAccount = async (userId: string, accountId: Types.ObjectId) => {
  const account = await ChartOfAccountModel.findOne({
    _id: accountId,
    ...companyScope(userId),
    isDeleted: false,
  });
  if (!account) throw new AppError(httpStatus.BAD_REQUEST, "Chart of account not found");
  return account;
};

const createDB = async (payload: TBudgetAllocation) => {
  const budget = await ensureBudget(payload.user_id.toString(), payload.budget_id);
  await ensureAccount(payload.user_id.toString(), payload.account_id);

  const allocation = await BudgetAllocationModel.create({
    ...payload,
    spent_amount: 0,
    remaining_amount: payload.allocated_amount,
  });

  const total = await recalculateBudgetTotal(budget._id!, payload.user_id.toString());
  if (budget.status === "draft") {
    const count = await BudgetAllocationModel.countDocuments({
      budget_id: budget._id,
      ...companyScope(payload.user_id.toString()),
      isDeleted: false,
    });
    if (count > 0) {
      budget.status = "approved";
      budget.total_budget_amount = total;
      await budget.save();
    }
  }

  return allocation;
};

const updateDB = async (id: string, userId: string, payload: Partial<TBudgetAllocation>) => {
  const record = await BudgetAllocationModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Budget allocation not found");
  if (payload.budget_id) await ensureBudget(userId, payload.budget_id);
  if (payload.account_id) await ensureAccount(userId, payload.account_id);

  if (payload.allocated_amount !== undefined) {
    record.allocated_amount = payload.allocated_amount;
    record.remaining_amount = payload.allocated_amount - record.spent_amount;
  }
  if (payload.budget_id) record.budget_id = payload.budget_id;
  if (payload.account_id) record.account_id = payload.account_id;
  await record.save();

  await recalculateBudgetTotal(record.budget_id, userId);
  return record;
};

const deleteDBOne = async (id: string, userId: string) => {
  const record = await BudgetAllocationModel.findOne({ _id: id, ...companyScope(userId), isDeleted: false });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Budget allocation not found");
  const budgetId = record.budget_id;
  record.isDeleted = true;
  await record.save();
  await recalculateBudgetTotal(budgetId, userId);
  return record;
};

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const base = BudgetAllocationModel.find({ ...companyScope(userId), isDeleted: false })
    .populate("budget_id", "budget_name status budget_type total_budget_amount")
    .populate("account_id", "account_code account_name normal_balance");
  const build = new queryBuilder(base, query);
  await build.searchNested({
    localFields: [],
    refs: [
      {
        foreignField: "budget_id",
        model: BudgetModel as never,
        fields: ["budget_name"],
        refFilter: { ...companyScope(userId), isDeleted: false },
      },
      {
        foreignField: "account_id",
        model: ChartOfAccountModel as never,
        fields: ["account_code", "account_name"],
        refFilter: { ...companyScope(userId), isDeleted: false },
      },
    ],
  });
  build.filter().sort().fields();
  const { totalData } = await build.paginate(
    BudgetAllocationModel.find({ ...companyScope(userId), isDeleted: false })
  );
  const rows = await build.modelQuery.exec();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  return { rows, pagination: build.calculatePagination({ totalData, currentPage: page, limit }) };
};

const listExpenseAccountsDB = async (userId: string) =>
  ChartOfAccountModel.find({
    ...companyScope(userId),
    isDeleted: false,
    account_code: { $gte: "5000", $lte: "5999" },
  })
    .select("_id account_code account_name normal_balance")
    .sort({ account_code: 1 })
    .lean();

const deleteDB = withBulkDeleteId(deleteDBOne);

export const budgetAllocationService = {
  createDB,
  updateDB,
  deleteDB,
  getAllDB,
  listExpenseAccountsDB,
};
