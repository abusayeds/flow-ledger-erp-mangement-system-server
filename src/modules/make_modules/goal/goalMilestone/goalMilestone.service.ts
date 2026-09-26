import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { companyScope } from "../../account/account.utils";
import { assertMilestoneTotalWithinGoal } from "../goal.core.service";
import { TGoalMilestone } from "../goal.types";
import { GoalModel } from "../goals/goal.model";
import { GoalMilestoneModel } from "./goalMilestone.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const ensureGoal = async (userId: string, goalId: Types.ObjectId) => {
  const goal = await GoalModel.findOne({ _id: goalId, ...companyScope(userId), isDeleted: false });
  if (!goal) throw new AppError(httpStatus.BAD_REQUEST, "Goal not found");
  return goal;
};

const createDB = async (payload: TGoalMilestone) => {
  await ensureGoal(payload.user_id.toString(), payload.goal_id);
  await assertMilestoneTotalWithinGoal(
    payload.goal_id.toString(),
    payload.user_id.toString(),
    payload.target_amount
  );
  return GoalMilestoneModel.create({
    ...payload,
    achieved_amount: 0,
    status: payload.status ?? "pending",
  });
};

const updateDB = async (id: string, userId: string, payload: Partial<TGoalMilestone>) => {
  const record = await GoalMilestoneModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Milestone not found");
  const goalId = (payload.goal_id ?? record.goal_id).toString();
  if (payload.goal_id) await ensureGoal(userId, payload.goal_id);
  if (payload.target_amount !== undefined) {
    await assertMilestoneTotalWithinGoal(goalId, userId, payload.target_amount, id);
  }
  Object.assign(record, payload);
  await record.save();
  return record;
};

const deleteDBOne = async (id: string, userId: string) => {
  const record = await GoalMilestoneModel.findOneAndUpdate(
    { _id: id, ...companyScope(userId) },
    { isDeleted: true },
    { new: true }
  );
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Milestone not found");
  return record;
};

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const base = GoalMilestoneModel.find({ ...companyScope(userId), isDeleted: false }).populate(
    "goal_id",
    "goal_name goal_type status target_amount"
  );
  const build = new queryBuilder(base, query)
    .search(["milestone_name", "milestone_description"])
    .filter()
    .sort()
    .fields();
  const { totalData } = await build.paginate(
    GoalMilestoneModel.find({ ...companyScope(userId), isDeleted: false })
  );
  const rows = await build.modelQuery.exec();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  return { rows, pagination: build.calculatePagination({ totalData, currentPage: page, limit }) };
};

const getSingleDB = async (id: string, userId: string) => {
  const record = await GoalMilestoneModel.findOne({ _id: id, ...companyScope(userId), isDeleted: false })
    .populate("goal_id", "goal_name goal_type status target_amount current_amount");
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Milestone not found");
  return record;
};

const deleteDB = withBulkDeleteId(deleteDBOne);

export const goalMilestoneService = {
  createDB,
  updateDB,
  deleteDB,
  getAllDB,
  getSingleDB,
};
