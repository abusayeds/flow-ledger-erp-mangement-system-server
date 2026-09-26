import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { companyScope } from "../../account/account.utils";
import {
  addGoalContribution,
  checkMilestoneAchievements,
  updateGoalTracking,
} from "../goal.core.service";
import { TGoalContribution } from "../goal.types";
import { GoalModel } from "../goals/goal.model";
import { GoalContributionModel } from "./goalContribution.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const createDB = async (
  userId: string,
  creatorId: Types.ObjectId | undefined,
  payload: {
    goal_id: Types.ObjectId;
    contribution_date: Date;
    contribution_amount: number;
    contribution_type?: TGoalContribution["contribution_type"];
    reference_type?: TGoalContribution["reference_type"];
    reference_id?: Types.ObjectId;
    notes?: string;
  }
) => {
  const goal = await GoalModel.findOne({
    _id: payload.goal_id,
    ...companyScope(userId),
    isDeleted: false,
  });
  if (!goal) throw new AppError(httpStatus.NOT_FOUND, "Goal not found");

  const contribution = await addGoalContribution(
    payload.goal_id.toString(),
    userId,
    creatorId,
    {
      contribution_date: payload.contribution_date,
      contribution_amount: payload.contribution_amount,
      contribution_type: payload.contribution_type ?? "manual",
      reference_type: payload.reference_type,
      reference_id: payload.reference_id,
      notes: payload.notes,
    }
  );
  if (!contribution) {
    throw new AppError(httpStatus.BAD_REQUEST, "Goal is already completed or contribution is zero");
  }
  return contribution;
};

const updateDB = async (id: string, userId: string, payload: Partial<TGoalContribution>) => {
  const record = await GoalContributionModel.findOne({
    _id: id,
    ...companyScope(userId)
  });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Contribution not found");

  const oldAmount = record.contribution_amount;
  const goalId = (payload.goal_id ?? record.goal_id).toString();
  const goal = await GoalModel.findOne({ _id: goalId, ...companyScope(userId) });
  if (!goal) throw new AppError(httpStatus.NOT_FOUND, "Goal not found");

  Object.assign(record, payload);
  await record.save();

  goal.current_amount = goal.current_amount - oldAmount + record.contribution_amount;
  if (goal.current_amount > goal.target_amount) goal.current_amount = goal.target_amount;
  await goal.save();

  await updateGoalTracking(goalId, userId, record.creator_id);
  await checkMilestoneAchievements(goalId, userId);
  return record;
};

const deleteDBOne = async (id: string, userId: string) => {
  const record = await GoalContributionModel.findOne({
    _id: id,
    ...companyScope(userId),
    isDeleted: false,
  });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Contribution not found");

  const goal = await GoalModel.findOne({
    _id: record.goal_id,
    ...companyScope(userId),
    isDeleted: false,
  });
  if (goal) {
    goal.current_amount = Math.max(0, goal.current_amount - record.contribution_amount);
    if (goal.status === "completed" && goal.current_amount < goal.target_amount) {
      goal.status = "active";
    }
    await goal.save();
  }

  record.isDeleted = true;
  await record.save();
  return record;
};

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const base = GoalContributionModel.find({ ...companyScope(userId), isDeleted: false }).populate(
    "goal_id",
    "goal_name goal_type status"
  );
  const build = new queryBuilder(base, query);
  await build.searchNested({
    localFields: ["notes"],
    refs: [
      {
        foreignField: "goal_id",
        model: GoalModel as never,
        fields: ["goal_name"],
      },
    ],
  });
  build.filter().sort().fields();
  const { totalData } = await build.paginate(
    GoalContributionModel.find({ ...companyScope(userId), isDeleted: false })
  );
  const rows = await build.modelQuery.exec();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  return { rows, pagination: build.calculatePagination({ totalData, currentPage: page, limit }) };
};

const deleteDB = withBulkDeleteId(deleteDBOne);

export const goalContributionService = { createDB, updateDB, deleteDB, getAllDB };
