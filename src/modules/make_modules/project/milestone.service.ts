import httpStatus from "http-status";
import AppError from "../../../errors/AppError";
import { ProjectMilestoneModel } from "./project.model";
import {
  assertProject,
  companyObjectId,
  formatDate,
  formatProjectResponse,
  logProjectActivity,
} from "./project.utils";
import { Types } from "mongoose";
import { TMilestoneStatus } from "./project.interface";
import { withBulkDeleteIdSecond } from "../../../utils/bulkDelete";

const create = async (userId: string, body: Record<string, unknown>) => {
  await assertProject(String(body.project_id), userId);
  const milestone = await ProjectMilestoneModel.create({
    ...body,
    user_id: companyObjectId(userId),
    isDeleted: false,
    status: (body.status as TMilestoneStatus) || "Incomplete",
    progress: Number(body.progress ?? 0),
    cost: Number(body.cost ?? 0),
  });
  await logProjectActivity(new Types.ObjectId(userId), new Types.ObjectId(String(body.project_id)), "Create Milestone", {
    title: milestone.title,
  });
  return formatProjectResponse(milestone);
};

const update = async (userId: string, body: Record<string, unknown>) => {
  const milestone = await ProjectMilestoneModel.findOne({
    _id: body.milestone_id,
    user_id: userId,
  });
  if (!milestone) throw new AppError(httpStatus.NOT_FOUND, "Milestone not found");
  if (body.title !== undefined) milestone.title = String(body.title);
  if (body.cost !== undefined) milestone.cost = Number(body.cost);
  if (body.start_date) milestone.start_date = new Date(String(body.start_date));
  if (body.end_date) milestone.end_date = new Date(String(body.end_date));
  if (body.summary !== undefined) milestone.summary = String(body.summary);
  if (body.status) milestone.status = body.status as TMilestoneStatus;
  if (body.progress !== undefined) milestone.progress = Number(body.progress);
  await milestone.save();
  return formatProjectResponse(milestone);
};

const removeOne = async (userId: string, milestoneId: string) => {
  const milestone = await ProjectMilestoneModel.findOneAndUpdate(
    { _id: milestoneId, user_id: userId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!milestone) throw new AppError(httpStatus.NOT_FOUND, "Milestone not found");
  return formatProjectResponse(milestone);
};

const listByProject = async (userId: string, projectId: string) => {
  await assertProject(projectId, userId);
  const items = await ProjectMilestoneModel.find({
    project_id: projectId,
    user_id: userId,
    isDeleted: false,
  }).sort({ createdAt: -1 });
  return formatProjectResponse(
    items.map((m) => ({
      _id: m._id,
      title: m.title,
      cost: m.cost,
      start_date: formatDate(m.start_date),
      end_date: formatDate(m.end_date),
      summary: m.summary,
      status: m.status,
      progress: m.progress,
    }))
  );
};

const remove = withBulkDeleteIdSecond(removeOne);

export const milestoneService = { create, update, remove, listByProject };
