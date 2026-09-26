import httpStatus from "http-status";
import { Types } from "mongoose";
import { AuthRequest } from "../../../middlewares/auth";
import AppError from "../../../errors/AppError";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { TProject } from "./project.interface";
import { toObjectIds } from "./project.model";
import { applyCompanyUserToBody } from "./project.utils";
import { ActivityAction } from "../activities/activities.interface";
import { activitiesService } from "../activities/activities.service";
import { ActivityModule } from "../../../utils/activityModules";
import { activityActors } from "../../../utils/activityContext";
import { joinDeleteIdsFromBody } from "../../../utils/bulkDelete";
import { dashboardService } from "./dashboard.service";
import { projectService } from "./project.service";
import { milestoneService } from "./milestone.service";
import { taskService } from "./task.service";
import { bugService } from "./bug.service";
import { stageService } from "./stage.service";
import { fileService, UploadedFile } from "./file.service";
import { reportService } from "./report.service";

const companyId = (req: AuthRequest) => req.user?._id as string;
const creatorId = (req: AuthRequest) => req.user?._id as Types.ObjectId;

const buildProjectWritePayload = (
  req: AuthRequest,
  isUpdate: boolean
): { projectId?: string; payload: Partial<TProject> } => {
  applyCompanyUserToBody(req);
  const body = { ...req.body } as Record<string, unknown>;
  const projectId = body.project_id ? String(body.project_id) : undefined;
  delete body.project_id;

  if (body.user_ids) {
    body.teamMemberIds = toObjectIds(body.user_ids as string[]);
    delete body.user_ids;
  }
  if (body.start_date) body.start_date = new Date(String(body.start_date));
  if (body.end_date) body.end_date = new Date(String(body.end_date));
  if (body.budget !== undefined) body.budget = Number(body.budget);
  if (body.status === "OnHold") body.status = "Onhold";

  const payload = body as Partial<TProject>;
  payload.user_id = creatorId(req);

  if (isUpdate) {
    delete (payload as Record<string, unknown>).creator_id;
    delete (payload as Record<string, unknown>).isDeleted;
  } else {
    payload.creator_id = creatorId(req);
    payload.isDeleted = false;
    if (!payload.status) payload.status = "Ongoing";
    if (!payload.clientIds) payload.clientIds = [];
    if (!payload.teamMemberIds?.length) {
      throw new AppError(httpStatus.BAD_REQUEST, "user_ids is required");
    }
  }
  return { projectId, payload };
};

const dashboardHome = catchAsync(async (req: AuthRequest, res) => {
  const data = await dashboardService.home(companyId(req));
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Dashboard data retrieved successfully.",
    data,
  });
});

const getUsers = catchAsync(async (req: AuthRequest, res) => {
  const data = await projectService.getUsers(companyId(req));
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Users retrieved successfully.",
    data,
  });
});

const listProjects = catchAsync(async (req: AuthRequest, res) => {
  const result = await projectService.listProjects(companyId(req), req.query, req);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Projects retrieved successfully.",
    data: result.allRecords,
    pagination: result.pagination,
  });
});

const reportList = catchAsync(async (req: AuthRequest, res) => {
  const result = await reportService.reportList(companyId(req), req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Project report retrieved successfully.",
    data: result.allRecords,
    pagination: result.pagination,
  });
});

const reportDetails = catchAsync(async (req: AuthRequest, res) => {
  const data = await reportService.reportDetails(companyId(req), req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Project report detail retrieved successfully.",
    data,
  });
});

const createUpdateProject = catchAsync(async (req: AuthRequest, res) => {
  const isUpdate = !!req.body.project_id;
  const { projectId, payload } = buildProjectWritePayload(req, isUpdate);
  const data = await projectService.createOrUpdateProject(companyId(req), projectId, payload);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: req.body.project_id ? "Project updated successfully." : "Project created successfully.",
    data,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.project,
    entity_ids: [data._id!],
    action: req.body.project_id ? ActivityAction.updated : ActivityAction.created,
    title: req.body.project_id
      ? `Project ${data.name} Updated`
      : `Project ${data.name} Created`,
  });
});

const deleteProject = catchAsync(async (req: AuthRequest, res) => {
  const projectIds = joinDeleteIdsFromBody(req.body, "project_id");
  await projectService.deleteProject(companyId(req), projectIds);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Project deleted successfully.",
    data: null,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.project,
    entity_ids: projectIds.split(",").map((id) => new Types.ObjectId(id)),
    action: ActivityAction.archived,
    title: "Project Deleted",
  });
});

const statusUpdate = catchAsync(async (req: AuthRequest, res) => {
  await projectService.statusUpdate(companyId(req), String(req.body.project_id), String(req.body.status));
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Project status changed successfully.",
    data: null,
  });
});

const projectDetails = catchAsync(async (req: AuthRequest, res) => {
  const data = await projectService.projectDetails(companyId(req), String(req.params.id), req);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Project details fetched successfully.",
    data,
  });
});

const projectActivity = catchAsync(async (req: AuthRequest, res) => {
  const data = await projectService.projectActivity(companyId(req), String(req.params.projectId));
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Activity fetched successfully.",
    data,
  });
});

const inviteMember = catchAsync(async (req: AuthRequest, res) => {
  await projectService.inviteMembers(companyId(req), String(req.body.project_id), req.body.user_ids);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User added to project successfully.",
    data: null,
  });
});

const deleteMember = catchAsync(async (req: AuthRequest, res) => {
  await projectService.deleteMember(
    companyId(req),
    String(req.body.project_id),
    joinDeleteIdsFromBody(req.body, "user_id"),
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User removed from project successfully.",
    data: null,
  });
});

const inviteClient = catchAsync(async (req: AuthRequest, res) => {
  await projectService.inviteClients(companyId(req), String(req.body.project_id), req.body.client_ids);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Client added to project successfully.",
    data: null,
  });
});

const deleteClient = catchAsync(async (req: AuthRequest, res) => {
  await projectService.deleteClient(
    companyId(req),
    String(req.body.project_id),
    joinDeleteIdsFromBody(req.body, "client_id"),
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Client removed from project successfully.",
    data: null,
  });
});

const duplicateProject = catchAsync(async (req: AuthRequest, res) => {
  applyCompanyUserToBody(req);
  const data = await projectService.duplicateProject(
    companyId(req),
    creatorId(req),
    String(req.body.project_id)
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Project duplicated successfully.",
    data,
  });
});

const milestoneCreate = catchAsync(async (req: AuthRequest, res) => {
  applyCompanyUserToBody(req);
  const data = await milestoneService.create(companyId(req), req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Milestone created successfully.",
    data,
  });
});

const milestoneUpdate = catchAsync(async (req: AuthRequest, res) => {
  applyCompanyUserToBody(req);
  const data = await milestoneService.update(companyId(req), req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Milestone updated successfully.",
    data,
  });
});

const milestoneDelete = catchAsync(async (req: AuthRequest, res) => {
  await milestoneService.remove(companyId(req), joinDeleteIdsFromBody(req.body, "milestone_id"));
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Milestone deleted successfully.",
    data: null,
  });
});

const milestoneList = catchAsync(async (req: AuthRequest, res) => {
  const data = await milestoneService.listByProject(companyId(req), req.params.projectId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Milestones retrieved successfully.",
    data,
  });
});

const projectFileUpload = catchAsync(async (req: AuthRequest, res) => {
  const files = (req.files as unknown as UploadedFile[]) || [];
  const data = await fileService.upload(companyId(req), String(req.body.project_id), files, req);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Files uploaded successfully.",
    data,
  });
});

const projectFileList = catchAsync(async (req: AuthRequest, res) => {
  const data = await fileService.listByProject(companyId(req), req.params.projectId, req);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Files retrieved successfully.",
    data,
  });
});

const projectFileDelete = catchAsync(async (req: AuthRequest, res) => {
  await fileService.remove(companyId(req), joinDeleteIdsFromBody(req.body, "file_id"));
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "File deleted successfully.",
    data: null,
  });
});

const taskList = catchAsync(async (req: AuthRequest, res) => {
  const result = await taskService.listTasks(companyId(req), req.query, req);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tasks retrieved successfully.",
    data: result.allRecords,
    pagination: result.pagination,
  });
});

const taskCreateUpdate = catchAsync(async (req: AuthRequest, res) => {
  applyCompanyUserToBody(req);
  if (!req.body.creator_id) req.body.creator_id = creatorId(req);
  const data = await taskService.createOrUpdateTask(companyId(req), creatorId(req), req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: req.body.task_id ? "Task updated successfully." : "Task created successfully.",
    data,
  });
});

const taskDetails = catchAsync(async (req: AuthRequest, res) => {
  const data = await taskService.taskDetails(companyId(req), String(req.params.id), req);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Task details fetched successfully.",
    data,
  });
});

const taskDelete = catchAsync(async (req: AuthRequest, res) => {
  await taskService.deleteTask(companyId(req), joinDeleteIdsFromBody(req.body, "task_id"));
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Task deleted successfully.",
    data: null,
  });
});

const taskboard = catchAsync(async (req: AuthRequest, res) => {
  const data = await taskService.taskboard(companyId(req), String(req.params.projectId), req);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Taskboard retrieved successfully.",
    data,
  });
});

const taskStageUpdate = catchAsync(async (req: AuthRequest, res) => {
  await taskService.stageUpdate(
    companyId(req),
    creatorId(req),
    String(req.body.task_id),
    String(req.body.stage_id)
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Task stage updated successfully.",
    data: null,
  });
});

const taskCommentList = catchAsync(async (req: AuthRequest, res) => {
  const data = await taskService.commentList(companyId(req), String(req.params.taskId));
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Comments retrieved successfully.",
    data,
  });
});

const taskCommentCreate = catchAsync(async (req: AuthRequest, res) => {
  applyCompanyUserToBody(req);
  const data = await taskService.commentCreate(companyId(req), String(req.body.task_id), req.body.comment);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Comment added successfully.",
    data,
  });
});

const taskCommentDelete = catchAsync(async (req: AuthRequest, res) => {
  await taskService.commentDelete(companyId(req), joinDeleteIdsFromBody(req.body, "comment_id"));
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Comment deleted successfully.",
    data: null,
  });
});

const subtaskList = catchAsync(async (req: AuthRequest, res) => {
  const data = await taskService.subtaskList(companyId(req), String(req.params.taskId));
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Subtasks retrieved successfully.",
    data,
  });
});

const subtaskCreate = catchAsync(async (req: AuthRequest, res) => {
  applyCompanyUserToBody(req);
  const data = await taskService.subtaskCreate(companyId(req), String(req.body.task_id), req.body.name);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Subtask added successfully.",
    data,
  });
});

const subtaskToggle = catchAsync(async (req: AuthRequest, res) => {
  const data = await taskService.subtaskToggle(companyId(req), String(req.body.subtask_id));
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Subtask updated successfully.",
    data,
  });
});

const bugList = catchAsync(async (req: AuthRequest, res) => {
  const result = await bugService.listBugs(
    companyId(req),
    String(req.query.project_id),
    req.query,
    req
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Bugs retrieved successfully.",
    data: result.allRecords,
    pagination: result.pagination,
  });
});

const bugCreateUpdate = catchAsync(async (req: AuthRequest, res) => {
  applyCompanyUserToBody(req);
  if (!req.body.creator_id) req.body.creator_id = creatorId(req);
  const data = await bugService.createOrUpdateBug(companyId(req), creatorId(req), req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: req.body.bug_id ? "Bug updated successfully." : "Bug created successfully.",
    data,
  });
});

const bugDetails = catchAsync(async (req: AuthRequest, res) => {
  const data = await bugService.bugDetails(companyId(req), String(req.params.id), req);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Bug details fetched successfully.",
    data,
  });
});

const bugDelete = catchAsync(async (req: AuthRequest, res) => {
  await bugService.deleteBug(companyId(req), joinDeleteIdsFromBody(req.body, "bug_id"));
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Bug deleted successfully.",
    data: null,
  });
});

const bugStageUpdate = catchAsync(async (req: AuthRequest, res) => {
  await bugService.stageUpdate(
    companyId(req),
    creatorId(req),
    String(req.body.bug_id),
    String(req.body.stage_id)
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Bug stage updated successfully.",
    data: null,
  });
});

const bugCommentList = catchAsync(async (req: AuthRequest, res) => {
  const data = await bugService.commentList(companyId(req), String(req.params.bugId));
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Comments retrieved successfully.",
    data,
  });
});

const bugCommentCreate = catchAsync(async (req: AuthRequest, res) => {
  applyCompanyUserToBody(req);
  const data = await bugService.commentCreate(companyId(req), String(req.body.bug_id), req.body.comment);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Comment added successfully.",
    data,
  });
});

const bugCommentDelete = catchAsync(async (req: AuthRequest, res) => {
  await bugService.commentDelete(companyId(req), joinDeleteIdsFromBody(req.body, "comment_id"));
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Comment deleted successfully.",
    data: null,
  });
});

const taskStageAll = catchAsync(async (req: AuthRequest, res) => {
  const data = await stageService.taskStageAll(companyId(req), creatorId(req));
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Task stages retrieved successfully.",
    data,
  });
});

const taskStageCreate = catchAsync(async (req: AuthRequest, res) => {
  applyCompanyUserToBody(req);
  const data = await stageService.taskStageCreate(companyId(req), creatorId(req), req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Task stage created successfully.",
    data,
  });
});

const taskStageUpdateRoute = catchAsync(async (req: AuthRequest, res) => {
  const data = await stageService.taskStageUpdate(companyId(req), req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Task stage updated successfully.",
    data,
  });
});

const taskStageDelete = catchAsync(async (req: AuthRequest, res) => {
  await stageService.taskStageDelete(companyId(req), req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Task stage deleted successfully.",
    data: null,
  });
});

const taskStageReorder = catchAsync(async (req: AuthRequest, res) => {
  const ids = (req.body.ids ?? req.body.stages?.map((s: { id: string }) => s.id) ?? req.body.ordered_ids) as string[];
  const data = await stageService.taskStageReorder(companyId(req), ids);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Task stages reordered successfully.",
    data,
  });
});

const bugStageAll = catchAsync(async (req: AuthRequest, res) => {
  const data = await stageService.bugStageAll(companyId(req), creatorId(req));
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Bug stages retrieved successfully.",
    data,
  });
});

const bugStageCreate = catchAsync(async (req: AuthRequest, res) => {
  applyCompanyUserToBody(req);
  const data = await stageService.bugStageCreate(companyId(req), creatorId(req), req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Bug stage created successfully.",
    data,
  });
});

const bugStageUpdateRoute = catchAsync(async (req: AuthRequest, res) => {
  const data = await stageService.bugStageUpdate(companyId(req), req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Bug stage updated successfully.",
    data,
  });
});

const bugStageDelete = catchAsync(async (req: AuthRequest, res) => {
  await stageService.bugStageDelete(companyId(req), req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Bug stage deleted successfully.",
    data: null,
  });
});

const bugStageReorder = catchAsync(async (req: AuthRequest, res) => {
  const ids = (req.body.ids ?? req.body.stages?.map((s: { id: string }) => s.id) ?? req.body.ordered_ids) as string[];
  const data = await stageService.bugStageReorder(companyId(req), ids);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Bug stages reordered successfully.",
    data,
  });
});

export const projectController = {
  dashboardHome,
  getUsers,
  reportList,
  reportDetails,
  listProjects,
  createUpdateProject,
  deleteProject,
  statusUpdate,
  projectDetails,
  projectActivity,
  inviteMember,
  deleteMember,
  inviteClient,
  deleteClient,
  duplicateProject,
  milestoneCreate,
  milestoneUpdate,
  milestoneDelete,
  milestoneList,
  projectFileUpload,
  projectFileList,
  projectFileDelete,
  taskList,
  taskCreateUpdate,
  taskDetails,
  taskDelete,
  taskboard,
  taskStageUpdate,
  taskCommentList,
  taskCommentCreate,
  taskCommentDelete,
  subtaskList,
  subtaskCreate,
  subtaskToggle,
  bugList,
  bugCreateUpdate,
  bugDetails,
  bugDelete,
  bugStageUpdate,
  bugCommentList,
  bugCommentCreate,
  bugCommentDelete,
  taskStageAll,
  taskStageCreate,
  taskStageUpdateRoute,
  taskStageDelete,
  taskStageReorder,
  bugStageAll,
  bugStageCreate,
  bugStageUpdateRoute,
  bugStageDelete,
  bugStageReorder,
};
