import { Types } from "mongoose";
import httpStatus from "http-status";
import AppError from "../../../errors/AppError";
import { ChartOfAccountModel } from "../account/chartOfAccount/chartOfAccount.model";
import { companyScope } from "../account/account.utils";
import { GoalModel } from "./goals/goal.model";
import { GoalContributionModel } from "./goalContribution/goalContribution.model";
import { GoalMilestoneModel } from "./goalMilestone/goalMilestone.model";
import { GoalTrackingModel } from "./goalTracking/goalTracking.model";
import {
  ContributionReferenceType,
  ContributionType,
  GoalType,
  TGoalContribution,
} from "./goal.types";

export type CoaMovement = {
  accountId: Types.ObjectId;
  movementDate: Date;
  debitAmount: number;
  creditAmount: number;
  referenceType: ContributionReferenceType;
  referenceId?: Types.ObjectId;
  notes?: string;
};

const monthsBetween = (start: Date, end: Date) => {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(
    1,
    (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  );
};

const daysBetween = (from: Date, to: Date) =>
  Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

const getExpenseBaseline = async (
  userId: string,
  accountId: Types.ObjectId,
  currentDate: Date
) => {
  const end = new Date(currentDate);
  end.setDate(end.getDate() - 1);
  const start = new Date(currentDate);
  start.setMonth(start.getMonth() - 3);

  const rows = await GoalContributionModel.aggregate([
    {
      $lookup: {
        from: "financialgoals",
        localField: "goal_id",
        foreignField: "_id",
        as: "goal",
      },
    },
    { $unwind: "$goal" },
    {
      $match: {
        "goal.account_id": accountId,
        "goal.user_id": new Types.ObjectId(userId),
        contribution_date: { $gte: start, $lte: end },
        isDeleted: false,
      },
    },
    { $group: { _id: null, avg: { $avg: "$contribution_amount" } } },
  ]);
  return rows[0]?.avg ?? 100;
};

const calculateExpenseReduction = async (
  userId: string,
  goalAccountId: Types.ObjectId,
  debitAmount: number,
  creditAmount: number,
  movementDate: Date
) => {
  const baseline = await getExpenseBaseline(userId, goalAccountId, movementDate);
  const currentExpense = debitAmount - creditAmount;
  return Math.max(0, baseline - currentExpense);
};

const calculateContributionFromMovement = async (
  goalType: GoalType,
  normalBalance: string,
  movement: CoaMovement,
  userId: string
) => {
  let amount = 0;
  if (goalType === "savings" && normalBalance === "credit") {
    amount = movement.creditAmount - movement.debitAmount;
  } else if (goalType === "debt_reduction" && normalBalance === "credit") {
    amount = movement.debitAmount - movement.creditAmount;
  } else if (goalType === "expense_reduction" && normalBalance === "debit") {
    amount = await calculateExpenseReduction(
      userId,
      movement.accountId,
      movement.debitAmount,
      movement.creditAmount,
      movement.movementDate
    );
  }
  return Math.max(0, amount);
};

export const tryAutoContributeFromCoaMovement = async (
  userId: string,
  creatorId: Types.ObjectId | undefined,
  movement: CoaMovement
) => {
  const goals = await GoalModel.find({
    ...companyScope(userId),
    account_id: movement.accountId,
    status: "active",
    isDeleted: false,
  });
  if (!goals.length) return;

  const account = await ChartOfAccountModel.findOne({
    _id: movement.accountId,
    ...companyScope(userId),
    isDeleted: false,
  });
  if (!account) return;

  for (const goal of goals) {
    const contributionAmount = await calculateContributionFromMovement(
      goal.goal_type,
      account.normal_balance,
      movement,
      userId
    );
    if (contributionAmount > 0) {
      await addGoalContribution(
        goal._id!.toString(),
        userId,
        creatorId,
        {
          contribution_date: movement.movementDate,
          contribution_amount: contributionAmount,
          contribution_type: "automatic",
          reference_type: movement.referenceType,
          reference_id: movement.referenceId,
          notes:
            movement.notes ??
            `Auto-contribution from ${movement.referenceType}`,
        }
      );
    }
  }
};

export const distributeContributionToMilestones = async (
  goalId: string,
  userId: string,
  contributionAmount: number
) => {
  const milestones = await GoalMilestoneModel.find({
    goal_id: goalId,
    ...companyScope(userId),
    isDeleted: false,
  }).sort({ createdAt: 1 });

  let remaining = contributionAmount;
  for (const milestone of milestones) {
    if (remaining <= 0) break;
    const currentAchieved = milestone.achieved_amount ?? 0;
    const remainingForMilestone = milestone.target_amount - currentAchieved;
    if (remainingForMilestone <= 0) continue;

    const amountToAdd = Math.min(remaining, remainingForMilestone);
    milestone.achieved_amount = currentAchieved + amountToAdd;
    remaining -= amountToAdd;

    if (milestone.achieved_amount >= milestone.target_amount) {
      milestone.status = "achieved";
      if (!milestone.achieved_date) milestone.achieved_date = new Date();
    } else {
      milestone.status = "pending";
    }
    await milestone.save();
  }
};

export const checkMilestoneAchievements = async (goalId: string, userId: string) => {
  const goal = await GoalModel.findOne({ _id: goalId, ...companyScope(userId), isDeleted: false });
  if (!goal) return;

  const milestones = await GoalMilestoneModel.find({
    goal_id: goalId,
    ...companyScope(userId),
    isDeleted: false,
  }).sort({ createdAt: 1 });

  let remainingAmount = goal.current_amount;
  for (const milestone of milestones) {
    if (remainingAmount >= milestone.target_amount) {
      milestone.achieved_amount = milestone.target_amount;
      milestone.achieved_date = new Date();
      milestone.status = "achieved";
      remainingAmount -= milestone.target_amount;
    } else if (remainingAmount > 0) {
      milestone.achieved_amount = remainingAmount;
      milestone.status = "pending";
      milestone.achieved_date = undefined;
      remainingAmount = 0;
    } else {
      milestone.achieved_amount = 0;
      milestone.status = "pending";
      milestone.achieved_date = undefined;
    }
    await milestone.save();
  }
};

const calculateProjectedCompletion = async (goalId: string, userId: string, targetDate: Date) => {
  const goal = await GoalModel.findOne({ _id: goalId, ...companyScope(userId) });
  if (!goal) return targetDate;

  const contributions = await GoalContributionModel.find({
    goal_id: goalId,
    ...companyScope(userId),
    isDeleted: false,
    contribution_date: { $gte: goal.start_date },
  }).sort({ contribution_date: 1 });

  if (contributions.length < 2) return targetDate;

  const total = contributions.reduce((s, c) => s + c.contribution_amount, 0);
  const months = monthsBetween(
    contributions[0].contribution_date,
    contributions[contributions.length - 1].contribution_date
  );
  const avgMonthly = total / months;
  if (avgMonthly <= 0) return undefined;

  const remaining = goal.target_amount - goal.current_amount;
  const monthsNeeded = remaining / avgMonthly;
  const projected = new Date();
  projected.setMonth(projected.getMonth() + Math.ceil(monthsNeeded));
  return projected;
};

export const updateGoalTracking = async (
  goalId: string,
  userId: string,
  creatorId?: Types.ObjectId
) => {
  const goal = await GoalModel.findOne({ _id: goalId, ...companyScope(userId) });
  if (!goal) throw new AppError(httpStatus.NOT_FOUND, "Goal not found");

  const previousTracking = await GoalTrackingModel.findOne({
    goal_id: goalId,
    ...companyScope(userId)
  })
    .sort({ tracking_date: -1 })
    .lean();

  const previousAmount = previousTracking?.current_amount ?? 0;
  const contributionAmount = goal.current_amount - previousAmount;
  const progressPercentage =
    goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
  const daysRemaining = daysBetween(new Date(), goal.target_date);
  const projectedDate = await calculateProjectedCompletion(
    goalId,
    userId,
    goal.target_date
  );

  return GoalTrackingModel.create({
    user_id: goal.user_id,
    creator_id: creatorId ?? goal.creator_id,
    goal_id: goal._id,
    tracking_date: new Date(),
    previous_amount: previousAmount,
    contribution_amount: contributionAmount,
    current_amount: goal.current_amount,
    progress_percentage: progressPercentage,
    days_remaining: daysRemaining,
    projected_completion_date: projectedDate,
    on_track_status: "on_track"
  });
};

export const addGoalContribution = async (
  goalId: string,
  userId: string,
  creatorId: Types.ObjectId | undefined,
  data: {
    contribution_date: Date;
    contribution_amount: number;
    contribution_type?: ContributionType;
    reference_type?: ContributionReferenceType;
    reference_id?: Types.ObjectId;
    notes?: string;
  }
) => {
  const goal = await GoalModel.findOne({ _id: goalId, ...companyScope(userId), isDeleted: false });
  if (!goal) throw new AppError(httpStatus.NOT_FOUND, "Goal not found");
  if (goal.status !== "active") {
    throw new AppError(httpStatus.BAD_REQUEST, "Contributions require an active goal");
  }

  const remainingAmount = goal.target_amount - goal.current_amount;
  const actualContribution = Math.min(data.contribution_amount, remainingAmount);
  if (actualContribution <= 0) return null;

  const contribution = await GoalContributionModel.create({
    user_id: goal.user_id,
    creator_id: creatorId,
    goal_id: goal._id,
    contribution_date: data.contribution_date,
    contribution_amount: actualContribution,
    contribution_type: data.contribution_type ?? "manual",
    reference_type: data.reference_type ?? "manual",
    reference_id: data.reference_id,
    notes: data.notes ?? "",
  } satisfies Partial<TGoalContribution>);

  goal.current_amount = Math.min(goal.target_amount, goal.current_amount + actualContribution);
  await goal.save();

  await updateGoalTracking(goalId, userId, creatorId);
  await distributeContributionToMilestones(goalId, userId, actualContribution);

  if (goal.current_amount >= goal.target_amount) {
    goal.status = "completed";
    await goal.save();
  }

  return contribution;
};

export const assertMilestoneTotalWithinGoal = async (
  goalId: string,
  userId: string,
  addAmount: number,
  excludeMilestoneId?: string
) => {
  const goal = await GoalModel.findOne({ _id: goalId, ...companyScope(userId), isDeleted: false });
  if (!goal) throw new AppError(httpStatus.NOT_FOUND, "Goal not found");

  const match: Record<string, unknown> = { goal_id: goalId, ...companyScope(userId), isDeleted: false };
  if (excludeMilestoneId) match._id = { $ne: excludeMilestoneId };

  const agg = await GoalMilestoneModel.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$target_amount" } } },
  ]);
  const existingTotal = agg[0]?.total ?? 0;
  if (existingTotal + addAmount > goal.target_amount) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Total milestone amounts cannot exceed goal target amount of ${goal.target_amount}`
    );
  }
};

export const validateGoalAccount = async (userId: string, accountId?: Types.ObjectId) => {
  if (!accountId) return;
  const account = await ChartOfAccountModel.findOne({
    _id: accountId,
    ...companyScope(userId),
    isDeleted: false,
  });
  if (!account) throw new AppError(httpStatus.BAD_REQUEST, "Chart of account not found");
};
