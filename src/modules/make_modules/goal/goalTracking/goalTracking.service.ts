import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { companyScope } from "../../account/account.utils";
import { TGoalTracking } from "../goal.types";
import { GoalModel } from "../goals/goal.model";
import { formatTrackingDetail } from "../goal.utils";
import { GoalTrackingModel } from "./goalTracking.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const ensureGoal = async (userId: string, goalId: Types.ObjectId) => {
  const goal = await GoalModel.findOne({ _id: goalId, ...companyScope(userId), isDeleted: false });
  if (!goal) throw new AppError(httpStatus.BAD_REQUEST, "Goal not found");
};

const createDB = async (payload: TGoalTracking) => {
  await ensureGoal(payload.user_id.toString(), payload.goal_id);
  return GoalTrackingModel.create(payload);
};

const updateDB = async (id: string, userId: string, payload: Partial<TGoalTracking>) => {
  const record = await GoalTrackingModel.findOne({ _id: id, ...companyScope(userId) });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Tracking record not found");
  if (payload.goal_id) await ensureGoal(userId, payload.goal_id);
  Object.assign(record, payload);
  await record.save();
  return record;
};

const deleteDBOne = async (id: string, userId: string) => {
  const record = await GoalTrackingModel.findOneAndUpdate(
    { _id: id, ...companyScope(userId) },
    { isDeleted: true },
    { new: true }
  );
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Tracking record not found");
  return record;
};

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const base = GoalTrackingModel.find({ ...companyScope(userId), isDeleted: false }).populate(
    "goal_id",
    "goal_name target_amount current_amount status"
  );
  const build = new queryBuilder(base, query);
  await build.searchNested({
    localFields: [],
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
    GoalTrackingModel.find({ ...companyScope(userId), isDeleted: false })
  );
  const rows = await build.modelQuery.exec();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  return { rows, pagination: build.calculatePagination({ totalData, currentPage: page, limit }) };
};

const getSingleDB = async (id: string, userId: string) => {
  const record = await GoalTrackingModel.findOne({
    _id: id,
    ...companyScope(userId),
    isDeleted: false,
  })
    .populate({
      path: "goal_id",
      select:
        "goal_name goal_description goal_type target_amount current_amount start_date target_date priority status category_id account_id",
      populate: [
        { path: "category_id", select: "category_name category_code description" },
        { path: "account_id", select: "account_code account_name normal_balance" },
      ],
    })
    .populate("creator_id", "name email")
    .lean();

  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Tracking record not found");

  return formatTrackingDetail(record);
};

const deleteDB = withBulkDeleteId(deleteDBOne);

export const goalTrackingService = {
  createDB,
  updateDB,
  deleteDB,
  getAllDB,
  getSingleDB,
};
