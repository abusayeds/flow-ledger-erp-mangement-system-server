import httpStatus from "http-status";
import { Types } from "mongoose";
import queryBuilder from "../../../builder/queryBuilder";
import AppError from "../../../errors/AppError";
import {
  ProjectMilestoneModel,
  ProjectModel,
  ProjectTaskModel,
  TaskCommentModel,
  TaskStageModel,
  TaskSubtaskModel,
  toObjectIds,
} from "./project.model";
import {
  assertProject,
  ensureDefaultTaskStages,
  companyObjectId,
  formatProjectResponse,
  logProjectActivity,
  mapAssignedUsers,
  parseDuration,
  refShape,
  toListQuery,
} from "./project.utils";
import { TTaskPriority } from "./project.interface";
import { withBulkDeleteIdSecond } from "../../../utils/bulkDelete";

const listTasks = async (
  userId: string,
  query: Record<string, unknown>,
  req: { protocol: string; get: (n: string) => string | undefined }
) => {
  const listQuery = toListQuery(query);
  const baseFilter: Record<string, unknown> = { user_id: userId, isDeleted: false };
  if (listQuery.project_id) baseFilter.project_id = listQuery.project_id;

  const buildQuery = new queryBuilder(ProjectTaskModel.find(baseFilter), listQuery)
    .search(["title", "description"])
    .filter()
    .sort()
    .fields();

  const { totalData } = await buildQuery.paginate(ProjectTaskModel.find(baseFilter));
  const tasks = await buildQuery.modelQuery.exec();

  const currentPage = Number(listQuery.page) || 1;
  const limit = Number(listQuery.limit) || 10;
  const pagination = buildQuery.calculatePagination({ totalData, currentPage, limit });

  const allRecords = await Promise.all(
    tasks.map(async (task) => {
      const { start_date, end_date } = parseDuration(task.duration);
      const project = await ProjectModel.findById(task.project_id).select("name");
      const milestone = task.milestone_id
        ? await ProjectMilestoneModel.findById(task.milestone_id).select("title")
        : null;
      const assigned_users = await mapAssignedUsers(task.assigned_to, req);
      return formatProjectResponse({
        _id: task._id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        start_date,
        end_date,
        stage_id: task.stage_id,
        project_id: task.project_id,
        milestone_id: task.milestone_id,
        project: project ? refShape(project) : null,
        milestone: milestone ? refShape(milestone) : null,
        assigned_users,
      });
    })
  );

  return { allRecords, pagination };
};

const createOrUpdateTask = async (
  userId: string,
  creatorId: Types.ObjectId,
  body: Record<string, unknown>
) => {
  const assigned = toObjectIds(body.assigned_to as string[]);
  if (!assigned.length) throw new AppError(httpStatus.BAD_REQUEST, "assigned_to is required");

  if (body.task_id) {
    const task = await ProjectTaskModel.findOne({
      _id: body.task_id,
      user_id: userId
    });
    if (!task) throw new AppError(httpStatus.NOT_FOUND, "Task not found");
    task.title = String(body.title);
    task.priority = (body.priority as TTaskPriority) || task.priority;
    task.assigned_to = assigned;
    task.duration = String(body.duration ?? task.duration);
    task.description = String(body.description ?? "");
    if (body.milestone_id) task.milestone_id = new Types.ObjectId(String(body.milestone_id));
    if (body.stage_id) task.stage_id = new Types.ObjectId(String(body.stage_id));
    await task.save();
    const assigned_users = await mapAssignedUsers(task.assigned_to);
    return formatProjectResponse({
      _id: task._id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      duration: task.duration,
      stage_id: task.stage_id,
      project_id: task.project_id,
      milestone_id: task.milestone_id,
      assigned_users
    });
  }

  await assertProject(String(body.project_id), userId);
  let stageId = body.stage_id ? new Types.ObjectId(String(body.stage_id)) : undefined;
  if (!stageId) {
    await ensureDefaultTaskStages(userId, creatorId);
    const first = await TaskStageModel.findOne({ user_id: userId }).sort({ order: 1 });
    stageId = first?._id as Types.ObjectId | undefined;
  }

  const { task_id: _taskId, user_ids: _userIds, ...taskPayload } = body;
  const task = await ProjectTaskModel.create({
    ...taskPayload,
    user_id: companyObjectId(userId),
    assigned_to: assigned,
    priority: (body.priority as TTaskPriority) || "Medium",
    stage_id: stageId,
    creator_id: creatorId
  });

  await logProjectActivity(creatorId, new Types.ObjectId(String(body.project_id)), "Create Task", {
    title: task.title
  });

  const assigned_users = await mapAssignedUsers(task.assigned_to);
  return formatProjectResponse({
    _id: task._id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    duration: task.duration,
    stage_id: task.stage_id,
    project_id: task.project_id,
    milestone_id: task.milestone_id,
    assigned_users
  });
};

const taskDetails = async (
  userId: string,
  taskId: string,
  req: { protocol: string; get: (n: string) => string | undefined }
) => {
  const task = await ProjectTaskModel.findOne({ _id: taskId, user_id: userId, isDeleted: false });
  if (!task) throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  const project = await ProjectModel.findById(task.project_id).select("name");
  const milestone = task.milestone_id
    ? await ProjectMilestoneModel.findById(task.milestone_id).select("title")
    : null;
  const { start_date, end_date } = parseDuration(task.duration);
  const assigned_users = await mapAssignedUsers(task.assigned_to, req);
  return formatProjectResponse({
    _id: task._id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    start_date,
    end_date,
    stage_id: task.stage_id,
    project_id: task.project_id,
    milestone_id: task.milestone_id,
    created_at: (task as { createdAt?: Date }).createdAt,
    project: project ? refShape(project) : null,
    milestone: milestone ? refShape(milestone) : null,
    assigned_users,
  });
};

const deleteTaskOne = async (userId: string, taskId: string) => {
  const task = await ProjectTaskModel.findOneAndUpdate(
    { _id: taskId, user_id: userId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!task) throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  await TaskCommentModel.updateMany({ task_id: taskId }, { isDeleted: true });
  await TaskSubtaskModel.updateMany({ task_id: taskId }, { isDeleted: true });
};

const taskboard = async (
  userId: string,
  projectId: string,
  req: { protocol: string; get: (n: string) => string | undefined }
) => {
  await assertProject(projectId, userId);
  const stages = await TaskStageModel.find({ user_id: userId, isDeleted: false }).sort({ order: 1 });
  const allTasks = await ProjectTaskModel.find({
    project_id: projectId,
    user_id: userId,
    isDeleted: false,
  });

  return formatProjectResponse(
    await Promise.all(
    stages.map(async (stage, key) => {
      const filtered = allTasks.filter((t) => String(t.stage_id) === String(stage._id));
      const stageTasks = await Promise.all(
        filtered.map(async (task) => {
          const { start_date, end_date } = parseDuration(task.duration);
          return {
            _id: task._id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            start_date,
            end_date,
            project_id: task.project_id,
            milestone_id: task.milestone_id,
            previous_stage: stages[key - 1]?._id ?? 0,
            current_stage: stage._id,
            next_stage: stages[key + 1]?._id ?? 0,
            assigned_users: await mapAssignedUsers(task.assigned_to, req),
          };
        })
      );
      return {
        _id: stage._id,
        name: stage.name,
        color: stage.color,
        complete: stage.complete,
        order: stage.order,
        tasks: stageTasks,
      };
    })
    )
  );
};

const stageUpdate = async (userId: string, creatorId: Types.ObjectId, taskId: string, stageId: string) => {
  const task = await ProjectTaskModel.findOne({ _id: taskId, user_id: userId });
  if (!task) throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  const oldStage = task.stage_id ? await TaskStageModel.findById(task.stage_id) : null;
  const newStage = await TaskStageModel.findOne({ _id: stageId, user_id: userId });
  if (!newStage) throw new AppError(httpStatus.NOT_FOUND, "Stage not found");
  if (String(task.stage_id) !== stageId) {
    task.stage_id = newStage._id as Types.ObjectId;
    await task.save();
    await logProjectActivity(creatorId, task.project_id, "Move", {
      title: task.title,
      old_status: oldStage?.name ?? "Unknown",
      new_status: newStage.name
    });
  }
};

const commentList = async (userId: string, taskId: string) => {
  const task = await ProjectTaskModel.findOne({ _id: taskId, user_id: userId, isDeleted: false });
  if (!task) throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  const comments = await TaskCommentModel.find({ task_id: taskId, isDeleted: false })
    .populate("user_id", "name email image")
    .sort({ createdAt: -1 });
  return formatProjectResponse(comments);
};

const commentCreate = async (userId: string, taskId: string, comment: string) => {
  const task = await ProjectTaskModel.findOne({ _id: taskId, user_id: userId, isDeleted: false });
  if (!task) throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  const doc = await TaskCommentModel.create({
    user_id: companyObjectId(userId),
    task_id: taskId,
    comment,
    isDeleted: false,
  });
  return formatProjectResponse(doc);
};

const commentDeleteOne = async (userId: string, commentId: string) => {
  const doc = await TaskCommentModel.findOneAndUpdate(
    { _id: commentId, user_id: userId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!doc) throw new AppError(httpStatus.NOT_FOUND, "Comment not found");
  return formatProjectResponse(doc);
};

const commentDelete = withBulkDeleteIdSecond(commentDeleteOne);

const subtaskList = async (userId: string, taskId: string) => {
  const task = await ProjectTaskModel.findOne({ _id: taskId, user_id: userId, isDeleted: false });
  if (!task) throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  const items = await TaskSubtaskModel.find({ task_id: taskId, isDeleted: false }).sort({ createdAt: -1 });
  return formatProjectResponse(items);
};

const subtaskCreate = async (userId: string, taskId: string, name: string) => {
  const task = await ProjectTaskModel.findOne({ _id: taskId, user_id: userId, isDeleted: false });
  if (!task) throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  const doc = await TaskSubtaskModel.create({
    user_id: companyObjectId(userId),
    task_id: taskId,
    name,
    is_completed: false,
    isDeleted: false,
  });
  return formatProjectResponse(doc);
};

const subtaskToggle = async (userId: string, subtaskId: string) => {
  const sub = await TaskSubtaskModel.findOne({ _id: subtaskId, user_id: userId, isDeleted: false });
  if (!sub) throw new AppError(httpStatus.NOT_FOUND, "Subtask not found");
  sub.is_completed = !sub.is_completed;
  await sub.save();
  return formatProjectResponse(sub);
};

const deleteTask = withBulkDeleteIdSecond(deleteTaskOne);

export const taskService = {
  listTasks,
  createOrUpdateTask,
  taskDetails,
  deleteTask,
  taskboard,
  stageUpdate,
  commentList,
  commentCreate,
  commentDelete,
  subtaskList,
  subtaskCreate,
  subtaskToggle,
};
