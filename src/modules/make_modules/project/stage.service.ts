import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../errors/AppError";
import { BugStageModel, TaskStageModel } from "./project.model";
import {
  companyObjectId,
  ensureDefaultBugStages,
  ensureDefaultTaskStages,
  formatProjectResponse,
} from "./project.utils";
import { withBulkDeleteIdSecond } from "../../../utils/bulkDelete";

const taskStageAll = async (userId: string, creatorId: Types.ObjectId) => {
  await ensureDefaultTaskStages(userId, creatorId);
  const stages = await TaskStageModel.find({ user_id: userId, isDeleted: false }).sort({ order: 1 });
  return formatProjectResponse(stages);
};

const taskStageCreate = async (userId: string, creatorId: Types.ObjectId, body: { name: string; color: string }) => {
  await TaskStageModel.updateMany({ user_id: userId, isDeleted: false }, { $inc: { order: 1 } });
  await TaskStageModel.updateMany({ user_id: userId, isDeleted: false }, { complete: false });
  const stage = await TaskStageModel.create({
    ...body,
    user_id: companyObjectId(userId),
    creator_id: creatorId,
    complete: false,
    order: 0,
    isDeleted: false,
  });
  const last = await TaskStageModel.findOne({ user_id: userId, isDeleted: false }).sort({ order: -1 });
  if (last) {
    last.complete = true;
    await last.save();
  }
  return formatProjectResponse(stage);
};

const taskStageUpdate = async (userId: string, id: string, body: { name: string; color: string }) => {
  const stage = await TaskStageModel.findOneAndUpdate(
    { _id: id, user_id: userId },
    { name: body.name, color: body.color },
    { new: true }
  );
  if (!stage) throw new AppError(httpStatus.NOT_FOUND, "Task stage not found");
  return formatProjectResponse(stage);
};

const taskStageDeleteOne = async (userId: string, id: string) => {
  const stage = await TaskStageModel.findOneAndUpdate(
    { _id: id, user_id: userId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!stage) throw new AppError(httpStatus.NOT_FOUND, "Task stage not found");
  return formatProjectResponse(stage);
};

const taskStageReorder = async (userId: string, orderedIds: string[]) => {
  for (let i = 0; i < orderedIds.length; i++) {
    await TaskStageModel.updateOne(
      { _id: orderedIds[i], user_id: userId, isDeleted: false },
      { order: i, complete: false }
    );
  }
  const lastId = orderedIds[orderedIds.length - 1];
  if (lastId) {
    await TaskStageModel.updateOne({ _id: lastId, user_id: userId }, { complete: true });
  }
  const stages = await TaskStageModel.find({ user_id: userId, isDeleted: false }).sort({ order: 1 });
  return formatProjectResponse(stages);
};

const bugStageAll = async (userId: string, creatorId: Types.ObjectId) => {
  await ensureDefaultBugStages(userId, creatorId);
  const stages = await BugStageModel.find({ user_id: userId, isDeleted: false }).sort({ order: 1 });
  return formatProjectResponse(stages);
};

const bugStageCreate = async (userId: string, creatorId: Types.ObjectId, body: { name: string; color: string }) => {
  await BugStageModel.updateMany({ user_id: userId, isDeleted: false }, { $inc: { order: 1 } });
  await BugStageModel.updateMany({ user_id: userId, isDeleted: false }, { complete: false });
  const stage = await BugStageModel.create({
    ...body,
    user_id: companyObjectId(userId),
    creator_id: creatorId,
    complete: false,
    order: 0,
    isDeleted: false,
  });
  const last = await BugStageModel.findOne({ user_id: userId, isDeleted: false }).sort({ order: -1 });
  if (last) {
    last.complete = true;
    await last.save();
  }
  return formatProjectResponse(stage);
};

const bugStageUpdate = async (userId: string, id: string, body: { name: string; color: string }) => {
  const stage = await BugStageModel.findOneAndUpdate(
    { _id: id, user_id: userId },
    { name: body.name, color: body.color },
    { new: true }
  );
  if (!stage) throw new AppError(httpStatus.NOT_FOUND, "Bug stage not found");
  return formatProjectResponse(stage);
};

const bugStageDeleteOne = async (userId: string, id: string) => {
  const stage = await BugStageModel.findOneAndUpdate(
    { _id: id, user_id: userId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!stage) throw new AppError(httpStatus.NOT_FOUND, "Bug stage not found");
  return formatProjectResponse(stage);
};

const bugStageReorder = async (userId: string, orderedIds: string[]) => {
  for (let i = 0; i < orderedIds.length; i++) {
    await BugStageModel.updateOne(
      { _id: orderedIds[i], user_id: userId, isDeleted: false },
      { order: i, complete: false }
    );
  }
  const lastId = orderedIds[orderedIds.length - 1];
  if (lastId) {
    await BugStageModel.updateOne({ _id: lastId, user_id: userId }, { complete: true });
  }
  const stages = await BugStageModel.find({ user_id: userId, isDeleted: false }).sort({ order: 1 });
  return formatProjectResponse(stages);
};

const taskStageDelete = withBulkDeleteIdSecond(taskStageDeleteOne);

const bugStageDelete = withBulkDeleteIdSecond(bugStageDeleteOne);

export const stageService = {
  taskStageAll,
  taskStageCreate,
  taskStageUpdate,
  taskStageDelete,
  taskStageReorder,
  bugStageAll,
  bugStageCreate,
  bugStageUpdate,
  bugStageDelete,
  bugStageReorder,
};
