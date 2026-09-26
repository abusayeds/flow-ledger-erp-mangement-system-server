import { PipelineStage, Types } from "mongoose";
import { ChartOfAccountModel } from "../account/chartOfAccount/chartOfAccount.model";
import { JournalEntryItemModel } from "../account/journal/journalEntryItem.model";
import { companyObjectId, companyScope, creatorId as creatorIdFromReq } from "../account/account.utils";
import { AuthRequest } from "../../../middlewares/auth";
import { BudgetAllocationModel } from "./budgetAllocation/budgetAllocation.model";
import { BudgetModel } from "./budgets/budget.model";
import { BudgetMonitoringModel } from "./budgetMonitoring/budgetMonitoring.model";
import { BudgetPeriodModel } from "./budgetPeriod/budgetPeriod.model";

export const calculateActualSpending = async (
  userId: string,
  accountId: Types.ObjectId,
  startDate: Date,
  endDate: Date
) => {
  const account = await ChartOfAccountModel.findOne({
    _id: accountId,
    ...companyScope(userId),
    isDeleted: false,
  });
  if (!account) return 0;

  const userOid = companyObjectId(userId);
  const agg = await JournalEntryItemModel.aggregate([
    {
      $match: {
        user_id: userOid,
        account_id: accountId,
        isDeleted: false,
      },
    },
    {
      $lookup: {
        from: "journalentries",
        localField: "journal_entry_id",
        foreignField: "_id",
        as: "journal",
      },
    },
    { $unwind: "$journal" },
    {
      $match: {
        "journal.user_id": userOid,
        "journal.status": "posted",
        "journal.isDeleted": false,
        "journal.journal_date": { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        total_debit: { $sum: "$debit_amount" },
        total_credit: { $sum: "$credit_amount" },
      },
    },
  ]);
  const totalDebit = agg[0]?.total_debit ?? 0;
  const totalCredit = agg[0]?.total_credit ?? 0;

  if (account.normal_balance === "debit") {
    return Math.max(0, totalDebit - totalCredit);
  }
  return Math.max(0, totalCredit - totalDebit);
};

export const recalculateBudgetTotal = async (budgetId: Types.ObjectId, userId: string) => {
  const agg = await BudgetAllocationModel.aggregate([
    {
      $match: {
        budget_id: budgetId,
        user_id: new Types.ObjectId(userId),
        isDeleted: false,
      },
    },
    { $group: { _id: null, total: { $sum: "$allocated_amount" } } },
  ]);
  const total = agg[0]?.total ?? 0;
  await BudgetModel.updateOne(
    { _id: budgetId, ...companyScope(userId) },
    { total_budget_amount: total }
  );
  return total;
};

export const createBudgetMonitoring = async (
  budgetId: Types.ObjectId,
  userId: string,
  creatorId?: Types.ObjectId
) => {
  const allocations = await BudgetAllocationModel.find({
    budget_id: budgetId,
    ...companyScope(userId),
    isDeleted: false,
  });

  const totalAllocated = allocations.reduce((s, a) => s + a.allocated_amount, 0);
  const totalSpent = allocations.reduce((s, a) => s + a.spent_amount, 0);
  const totalRemaining = allocations.reduce((s, a) => s + a.remaining_amount, 0);
  const varianceAmount = totalAllocated - totalSpent;
  const variancePercentage = totalAllocated > 0 ? (varianceAmount / totalAllocated) * 100 : 0;

  return BudgetMonitoringModel.create({
    user_id: new Types.ObjectId(userId),
    creator_id: creatorId,
    budget_id: budgetId,
    monitoring_date: new Date(),
    total_allocated: totalAllocated,
    total_spent: totalSpent,
    total_remaining: totalRemaining,
    variance_amount: varianceAmount,
    variance_percentage: variancePercentage,
  });
};

export const updateBudgetSpending = async (budgetId: string, userId: string, creatorId?: Types.ObjectId) => {
  const budget = await BudgetModel.findOne({
    _id: budgetId,
    ...companyScope(userId)
  }).populate("period_id");
  if (!budget) return null;

  const period = await BudgetPeriodModel.findOne({
    _id: budgetPeriodId(budget),
    ...companyScope(userId)
  });
  if (!period) return null;

  const allocations = await BudgetAllocationModel.find({
    budget_id: budget._id,
    ...companyScope(userId)
  });

  for (const allocation of allocations) {
    const actualSpent = await calculateActualSpending(
      userId,
      allocation.account_id,
      period.start_date,
      period.end_date
    );
    allocation.spent_amount = actualSpent;
    allocation.remaining_amount = allocation.allocated_amount - actualSpent;
    await allocation.save();
  }

  await createBudgetMonitoring(budget._id, userId, creatorId);
  return true;
};

function budgetPeriodId(budget: { period_id: Types.ObjectId | { _id?: Types.ObjectId } }) {
  const p = budget.period_id;
  if (p && typeof p === "object" && "_id" in p && p._id) return p._id;
  return p as Types.ObjectId;
}

export const tryUpdateBudgetSpendingForAccount = async (
  userId: string,
  accountId: Types.ObjectId,
  creatorId?: Types.ObjectId
) => {
  const activeBudgets = await BudgetModel.find({
    ...companyScope(userId),
    status: "active",
    isDeleted: false,
  }).select("_id");

  for (const budget of activeBudgets) {
    const hasAllocation = await BudgetAllocationModel.exists({
      budget_id: budget._id,
      account_id: accountId,
      ...companyScope(userId),
      isDeleted: false,
    });
    if (hasAllocation) {
      await updateBudgetSpending(budget._id.toString(), userId, creatorId);
    }
  }
};

export const hookBudgetSpendingFromRequest = async (req: AuthRequest, accountId: Types.ObjectId) => {
  if (!req.user?._id) return;
  await tryUpdateBudgetSpendingForAccount(
    req.user._id as string,
    accountId,
    creatorIdFromReq(req)
  );
};
