import httpStatus from "http-status";
import { Types } from "mongoose";
import moment from "moment";
import queryBuilder from "../../../builder/queryBuilder";
import AppError from "../../../errors/AppError";
import { UserModel } from "../../basic_modules/user/user.model";
import { role } from "../../../utils/role";
import {
  ProjectActivityLogModel,
  ProjectBugModel,
  ProjectFileModel,
  ProjectMilestoneModel,
  ProjectModel,
  ProjectTaskModel,
  TaskCommentModel,
  TaskStageModel,
  TaskSubtaskModel,
  BugCommentModel,
  toObjectIds,
} from "./project.model";
import {
  assertProject,
  ensureDefaultTaskStages,
  formatActivityRemark,
  formatDate,
  getClientUsers,
  getStaffUsers,
  companyObjectId,
  formatProjectResponse,
  logProjectActivity,
  mapUser,
  toListQuery,
} from "./project.utils";
import { TProject, TProjectStatus } from "./project.interface";
import { withBulkDeleteIdSecond, runBulkDelete, parseDeleteIdsFromParam } from "../../../utils/bulkDelete";

const listProjects = async (
  userId: string,
  query: Record<string, unknown>,
  req: { protocol: string; get: (n: string) => string | undefined }
) => {
  const listQuery = toListQuery(query);
  const baseFilter = { user_id: userId, isDeleted: false };

  const buildQuery = new queryBuilder(ProjectModel.find(baseFilter), listQuery)
    .search(["name", "description"])
    .filter()
    .sort()
    .fields();

  const { totalData } = await buildQuery.paginate(ProjectModel.find(baseFilter));
  const projects = await buildQuery.modelQuery.exec();

  const currentPage = Number(listQuery.page) || 1;
  const limit = Number(listQuery.limit) || 10;
  const pagination = buildQuery.calculatePagination({ totalData, currentPage, limit });

  const allRecords = await Promise.all(
    projects.map(async (project) => {
      const totalTask = await ProjectTaskModel.countDocuments({
        project_id: project._id,
        isDeleted: false,
      });
      const taskIds = await ProjectTaskModel.find({ project_id: project._id, isDeleted: false }).select("_id");
      const totalComments = await TaskCommentModel.countDocuments({
        task_id: { $in: taskIds.map((t) => t._id) },
        isDeleted: false,
      });
      const members = await UserModel.find({ _id: { $in: project.teamMemberIds } }).select(
        "name email image"
      );
      const clients = await UserModel.find({ _id: { $in: project.clientIds } }).select(
        "name email image"
      );
      return {
        _id: project._id,
        name: project.name,
        status: project.status,
        description: project.description,
        budget : project.budget?.toLocaleString() ?? "0",
        total_task: totalTask,
        total_comments: totalComments,
        start_date: formatDate(project.start_date),
        end_date: formatDate(project.end_date),
        created_by: project.user_id,
        members: members.map((m) => mapUser(m, req)),
        clients: clients.map((c) => mapUser(c, req)),
      };
    })
  );

  return { allRecords: formatProjectResponse(allRecords), pagination };
};

const shapeProjectWriteResult = async (project: {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  budget?: number;
  start_date?: Date;
  end_date?: Date;
  status: TProjectStatus;
  teamMemberIds: Types.ObjectId[];
}) => {
  const users = await UserModel.find({ _id: { $in: project.teamMemberIds } }).select("name email");
  return formatProjectResponse({
    ...project,
    start_date: formatDate(project.start_date),
    end_date: formatDate(project.end_date),
    users: users.map((u) => ({ _id: u._id, name: u.name, email: u.email })),
  });
};

const createOrUpdateProject = async (
  userId: string,
  projectId: string | undefined,
  payload: Partial<TProject>
) => {
  const data = { ...payload, user_id: companyObjectId(userId) };

  if (projectId) {
    const project = await ProjectModel.findOneAndUpdate(
      { _id: projectId, user_id: userId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!project) {
      throw new AppError(httpStatus.NOT_FOUND, "Project not found");
    }
    return project
  }

  const project = await ProjectModel.create(data);
  return project
};

const deleteProjectOne = async (userId: string, projectId: string) => {
  const project = await assertProject(projectId, userId);
  await ProjectTaskModel.updateMany({ project_id: project._id }, { isDeleted: true });
  await ProjectBugModel.updateMany({ project_id: project._id }, { isDeleted: true });
  await ProjectMilestoneModel.updateMany({ project_id: project._id }, { isDeleted: true });
  await ProjectActivityLogModel.deleteMany({ project_id: project._id });
  await ProjectFileModel.updateMany({ project_id: project._id }, { isDeleted: true });
  project.isDeleted = true;
  await project.save();
};

const statusUpdate = async (userId: string, projectId: string, status: string) => {
  const normalized =
    status === "OnHold" ? "Onhold" : (status as TProjectStatus);
  if (!["Ongoing", "Onhold", "Finished"].includes(normalized)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid status");
  }
  const project = await assertProject(projectId, userId);
  project.status = normalized as TProjectStatus;
  await project.save();
};

const projectDetails = async (
  userId: string,
  projectId: string,
  req: { protocol: string; get: (n: string) => string | undefined }
) => {
  await ensureDefaultTaskStages(userId, new Types.ObjectId(userId));
  const project = await assertProject(projectId, userId);
  const milestones = await ProjectMilestoneModel.find({
    project_id: project._id,
    isDeleted: false,
  });
  const taskCount = await ProjectTaskModel.countDocuments({ project_id: project._id, isDeleted: false });
  const bugCount = await ProjectBugModel.countDocuments({ project_id: project._id, isDeleted: false });
  const daysLeft = project.end_date
    ? Math.max(0, moment(project.end_date).diff(moment(), "days"))
    : 0;
  const members = await UserModel.find({ _id: { $in: project.teamMemberIds } }).select("name email image");
  const clients = await UserModel.find({ _id: { $in: project.clientIds } }).select("name email image");
  const files = await ProjectFileModel.find({ project_id: project._id, isDeleted: false });
  const taskStages = await TaskStageModel.find({ user_id: userId, isDeleted: false })
    .sort({ order: 1 })
    .select("_id name");

  return formatProjectResponse({
    _id: project._id,
    name: project.name,
    start_date: formatDate(project.start_date),
    end_date: formatDate(project.end_date),
    status: project.status,
    description: project.description,
    daysleft: daysLeft,
    budget: project.budget?.toLocaleString() ?? "0",
    total_task: taskCount,
    total_bug: bugCount,
    members: members.map((m) => mapUser(m, req)),
    clients: clients.map((c) => mapUser(c, req)),
    milestones: milestones.map((m) => ({
      _id: m._id,
      title: m.title,
      start_date: formatDate(m.start_date),
      end_date: formatDate(m.end_date),
      status: m.status,
      cost: m.cost,
      progress: m.progress,
      summary: m.summary,
    })),
    files: files.map((f) => ({
      _id: f._id,
      project_id: f.project_id,
      file_name: f.file_name,
      file_path: f.file_path.startsWith("http")
        ? f.file_path
        : `${req.protocol}://${req.get("host")}${f.file_path.startsWith("/") ? f.file_path : `/${f.file_path}`}`,
    })),
    task_stages: taskStages.map((s) => ({ _id: s._id, name: s.name })),
  });
};

const projectActivity = async (userId: string, projectId: string) => {
  await assertProject(projectId, userId);
  const logs = await ProjectActivityLogModel.find({ project_id: projectId })
    .sort({ createdAt: -1 })
    .populate("user_id", "name");
  return formatProjectResponse(
    await Promise.all(
      logs.map(async (log) => ({
        _id: log._id,
        remark: await formatActivityRemark(log),
        time: moment((log as { createdAt?: Date }).createdAt).fromNow(),
      }))
    )
  );
};



const inviteMembers = async (userId: string, projectId: string, userIds: string[]) => {
  const project = await assertProject(projectId, userId);
  const ids = toObjectIds(userIds);
  const merged = [...new Set([...project.teamMemberIds.map(String), ...ids.map(String)])].map(
    (id) => new Types.ObjectId(id)
  );
  project.teamMemberIds = merged;
  await project.save();
  for (const uid of ids) {
    await logProjectActivity(new Types.ObjectId(userId), project._id, "Invite User", {
      user_id: uid,
    });
  }
};

const deleteMemberOne = async (userId: string, projectId: string, memberId: string) => {
  const project = await assertProject(projectId, userId);
  project.teamMemberIds = project.teamMemberIds.filter((id) => String(id) !== memberId);
  await project.save();
};

const inviteClients = async (userId: string, projectId: string, clientIds: string[]) => {
  const project = await assertProject(projectId, userId);
  const clients = await getClientUsers( clientIds);
  if (clients.length !== clientIds.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid client id(s)");
  }
  const merged = [...new Set([...project.clientIds.map(String), ...clientIds])].map(
    (id) => new Types.ObjectId(id)
  );
  project.clientIds = merged;
  await project.save();
  for (const cid of clientIds) {
    await logProjectActivity(new Types.ObjectId(userId), project._id, "Share with Client", {
      client_id: cid,
    });
  }
};

const deleteClientOne = async (userId: string, projectId: string, clientId: string) => {
  const project = await assertProject(projectId, userId);
  project.clientIds = project.clientIds.filter((id) => String(id) !== clientId);
  await project.save();
};

const duplicateProject = async (userId: string, creatorId: Types.ObjectId, projectId: string) => {
  const original = await assertProject(projectId, userId);
  const body = { all: true };
  const newProject = await ProjectModel.create({
    user_id: companyObjectId(userId),
    name: `${original.name} (Copy)`,
    description: original.description,
    budget: original.budget,
    start_date: original.start_date,
    end_date: original.end_date,
    status: original.status,
    creator_id: creatorId,
    teamMemberIds: body.all ? [...original.teamMemberIds] : [],
    clientIds: body.all ? [...original.clientIds] : [],
    isDeleted: false,
  });

  const milestoneMap = new Map<string, Types.ObjectId>();
  if (body.all) {
    const milestones = await ProjectMilestoneModel.find({
      project_id: original._id,
      isDeleted: false,
    });
    for (const m of milestones) {
      const nm = await ProjectMilestoneModel.create({
        user_id: companyObjectId(userId),
        project_id: newProject._id,
        title: m.title,
        cost: m.cost,
        start_date: m.start_date,
        end_date: m.end_date,
        summary: m.summary,
        status: m.status,
        progress: m.progress,
        isDeleted: false,
      });
      milestoneMap.set(String(m._id), nm._id as Types.ObjectId);
    }
  }

  if (body.all) {
    const tasks = await ProjectTaskModel.find({ project_id: original._id, isDeleted: false });
    for (const task of tasks) {
      const newTask = await ProjectTaskModel.create({
        user_id: companyObjectId(userId),
        project_id: newProject._id,
        milestone_id: task.milestone_id
          ? milestoneMap.get(String(task.milestone_id))
          : undefined,
        title: task.title,
        priority: task.priority,
        assigned_to: [...task.assigned_to],
        duration: task.duration,
        description: task.description,
        stage_id: task.stage_id,
        creator_id: creatorId,
        isDeleted: false,
      });
      const subtasks = await TaskSubtaskModel.find({ task_id: task._id, isDeleted: false });
      for (const st of subtasks) {
        await TaskSubtaskModel.create({
          user_id: companyObjectId(userId),
          task_id: newTask._id,
          name: st.name,
          is_completed: st.is_completed,
          isDeleted: false,
        });
      }
      const comments = await TaskCommentModel.find({ task_id: task._id, isDeleted: false });
      for (const c of comments) {
        await TaskCommentModel.create({
          user_id: companyObjectId(userId),
          task_id: newTask._id,
          comment: c.comment,
          isDeleted: false,
        });
      }
    }

    const bugs = await ProjectBugModel.find({ project_id: original._id, isDeleted: false });
    for (const bug of bugs) {
      const newBug = await ProjectBugModel.create({
        user_id: companyObjectId(userId),
        project_id: newProject._id,
        title: bug.title,
        priority: bug.priority,
        assigned_to: [...bug.assigned_to],
        description: bug.description,
        stage_id: bug.stage_id,
        creator_id: creatorId,
        isDeleted: false,
      });
      const comments = await BugCommentModel.find({ bug_id: bug._id, isDeleted: false });
      for (const c of comments) {
        await BugCommentModel.create({
          user_id: companyObjectId(userId),
          bug_id: newBug._id,
          comment: c.comment,
          isDeleted: false,
        });
      }
    }

    const logs = await ProjectActivityLogModel.find({ project_id: original._id });
    for (const log of logs) {
      await ProjectActivityLogModel.create({
        user_id: log.user_id,
        project_id: newProject._id,
        log_type: log.log_type,
        remark: log.remark,
      });
    }

    const files = await ProjectFileModel.find({ project_id: original._id, isDeleted: false });
    for (const f of files) {
      await ProjectFileModel.create({
        user_id: companyObjectId(userId),
        project_id: newProject._id,
        file_name: f.file_name,
        file_path: f.file_path,
        isDeleted: false,
      });
    }
  }

  return formatProjectResponse({ _id: newProject._id, name: newProject.name });
};

const getUsers = async (userId: string) => {
  const users = await getStaffUsers(userId);
  return formatProjectResponse(
    users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      type: u.role,
    }))
  );
};

const deleteProject = withBulkDeleteIdSecond(deleteProjectOne);

const deleteMember = async (userId: string, projectId: string, memberId: string) =>
  runBulkDelete(parseDeleteIdsFromParam(memberId), (oneId) => deleteMemberOne(userId, projectId, oneId));

const deleteClient = async (userId: string, projectId: string, clientId: string) =>
  runBulkDelete(parseDeleteIdsFromParam(clientId), (oneId) => deleteClientOne(userId, projectId, oneId));

export const projectService = {
  listProjects,
  createOrUpdateProject,
  deleteProject,
  statusUpdate,
  projectDetails,
  projectActivity,
  inviteMembers,
  deleteMember,
  inviteClients,
  deleteClient,
  duplicateProject,
  getUsers,
};
