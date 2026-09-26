import httpStatus from "http-status";
import { Types } from "mongoose";
import queryBuilder from "../../../builder/queryBuilder";
import AppError from "../../../errors/AppError";
import {
  BugCommentModel,
  BugStageModel,
  ProjectBugModel,
  ProjectModel,
  toObjectIds,
} from "./project.model";
import {
  assertProject,
  ensureDefaultBugStages,
  companyObjectId,
  formatProjectResponse,
  logProjectActivity,
  mapAssignedUsers,
  refShape,
  toListQuery,
} from "./project.utils";
import { TTaskPriority } from "./project.interface";
import { withBulkDeleteIdSecond } from "../../../utils/bulkDelete";

const listBugs = async (
  userId: string,
  projectId: string,
  query: Record<string, unknown>,
  req: { protocol: string; get: (n: string) => string | undefined }
) => {
  await assertProject(projectId, userId);
  const listQuery = toListQuery({ ...query, project_id: projectId });
  const baseFilter = { project_id: projectId, user_id: userId, isDeleted: false };

  const buildQuery = new queryBuilder(ProjectBugModel.find(baseFilter), listQuery)
    .search(["title", "description"])
    .filter()
    .sort()
    .fields();

  const { totalData } = await buildQuery.paginate(ProjectBugModel.find(baseFilter));
  const bugs = await buildQuery.modelQuery.exec();

  const currentPage = Number(listQuery.page) || 1;
  const limit = Number(listQuery.limit) || 10;
  const pagination = buildQuery.calculatePagination({ totalData, currentPage, limit });

  const allRecords = formatProjectResponse(
    await Promise.all(
      bugs.map(async (bug) => ({
        _id: bug._id,
        title: bug.title,
        description: bug.description,
        priority: bug.priority,
        stage_id: bug.stage_id,
        project_id: bug.project_id,
        assigned_users: await mapAssignedUsers(bug.assigned_to, req),
      }))
    )
  );

  return { allRecords, pagination };
};

const createOrUpdateBug = async (
  userId: string,
  creatorId: Types.ObjectId,
  body: Record<string, unknown>
) => {
  const assigned = toObjectIds(body.assigned_to as string[]);

  if (body.bug_id) {
    const bug = await ProjectBugModel.findOne({
      _id: body.bug_id,
      user_id: userId
    });
    if (!bug) throw new AppError(httpStatus.NOT_FOUND, "Bug not found");
    bug.title = String(body.title);
    bug.priority = (body.priority as TTaskPriority) || bug.priority;
    if (assigned.length) bug.assigned_to = assigned;
    bug.description = String(body.description ?? "");
    if (body.stage_id) bug.stage_id = new Types.ObjectId(String(body.stage_id));
    await bug.save();
    return formatProjectResponse({
      _id: bug._id,
      title: bug.title,
      description: bug.description,
      priority: bug.priority,
      stage_id: bug.stage_id,
      project_id: bug.project_id,
      assigned_users: await mapAssignedUsers(bug.assigned_to)
    });
  }

  await assertProject(String(body.project_id), userId);
  let stageId = body.stage_id ? new Types.ObjectId(String(body.stage_id)) : undefined;
  if (!stageId) {
    await ensureDefaultBugStages(userId, creatorId);
    const first = await BugStageModel.findOne({ user_id: userId }).sort({ order: 1 });
    stageId = first?._id as Types.ObjectId | undefined;
  }

  const { bug_id: _bugId, user_ids: _userIds, ...bugPayload } = body;
  const bug = await ProjectBugModel.create({
    ...bugPayload,
    user_id: companyObjectId(userId),
    assigned_to: assigned,
    priority: (body.priority as TTaskPriority) || "Medium",
    stage_id: stageId,
    creator_id: creatorId
  });

  await logProjectActivity(creatorId, new Types.ObjectId(String(body.project_id)), "Create Bug", {
    title: bug.title
  });

  return formatProjectResponse({
    _id: bug._id,
    title: bug.title,
    description: bug.description,
    priority: bug.priority,
    stage_id: bug.stage_id,
    project_id: bug.project_id,
    assigned_users: await mapAssignedUsers(bug.assigned_to)
  });
};

const bugDetails = async (
  userId: string,
  bugId: string,
  req: { protocol: string; get: (n: string) => string | undefined }
) => {
  const bug = await ProjectBugModel.findOne({ _id: bugId, user_id: userId, isDeleted: false });
  if (!bug) throw new AppError(httpStatus.NOT_FOUND, "Bug not found");
  const project = await ProjectModel.findById(bug.project_id).select("name");
  return formatProjectResponse({
    _id: bug._id,
    title: bug.title,
    description: bug.description,
    priority: bug.priority,
    stage_id: bug.stage_id,
    project_id: bug.project_id,
    project: project ? refShape(project) : null,
    assigned_users: await mapAssignedUsers(bug.assigned_to, req),
  });
};

const deleteBugOne = async (userId: string, bugId: string) => {
  const bug = await ProjectBugModel.findOneAndUpdate(
    { _id: bugId, user_id: userId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!bug) throw new AppError(httpStatus.NOT_FOUND, "Bug not found");
  await BugCommentModel.updateMany({ bug_id: bugId }, { isDeleted: true });
};

const stageUpdate = async (userId: string, creatorId: Types.ObjectId, bugId: string, stageId: string) => {
  const bug = await ProjectBugModel.findOne({ _id: bugId, user_id: userId });
  if (!bug) throw new AppError(httpStatus.NOT_FOUND, "Bug not found");
  const oldStage = bug.stage_id ? await BugStageModel.findById(bug.stage_id) : null;
  const newStage = await BugStageModel.findOne({ _id: stageId, user_id: userId });
  if (!newStage) throw new AppError(httpStatus.NOT_FOUND, "Stage not found");
  if (String(bug.stage_id) !== stageId) {
    bug.stage_id = newStage._id as Types.ObjectId;
    await bug.save();
    await logProjectActivity(creatorId, bug.project_id, "Move Bug", {
      title: bug.title,
      old_status: oldStage?.name ?? "Unknown",
      new_status: newStage.name
    });
  }
};

const commentList = async (userId: string, bugId: string) => {
  const bug = await ProjectBugModel.findOne({ _id: bugId, user_id: userId, isDeleted: false });
  if (!bug) throw new AppError(httpStatus.NOT_FOUND, "Bug not found");
  const comments = await BugCommentModel.find({ bug_id: bugId, isDeleted: false })
    .populate("user_id", "name email image")
    .sort({ createdAt: -1 });
  return formatProjectResponse(comments);
};

const commentCreate = async (userId: string, bugId: string, comment: string) => {
  const bug = await ProjectBugModel.findOne({ _id: bugId, user_id: userId, isDeleted: false });
  if (!bug) throw new AppError(httpStatus.NOT_FOUND, "Bug not found");
  const doc = await BugCommentModel.create({
    user_id: companyObjectId(userId),
    bug_id: bugId,
    comment,
    isDeleted: false,
  });
  return formatProjectResponse(doc);
};

const commentDeleteOne = async (userId: string, commentId: string) => {
  const doc = await BugCommentModel.findOneAndUpdate(
    { _id: commentId, user_id: userId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!doc) throw new AppError(httpStatus.NOT_FOUND, "Comment not found");
  return formatProjectResponse(doc);
};

const commentDelete = withBulkDeleteIdSecond(commentDeleteOne);

const deleteBug = withBulkDeleteIdSecond(deleteBugOne);

export const bugService = {
  listBugs,
  createOrUpdateBug,
  bugDetails,
  deleteBug,
  stageUpdate,
  commentList,
  commentCreate,
  commentDelete,
};
