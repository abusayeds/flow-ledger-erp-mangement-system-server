import moment from "moment";
import { Types } from "mongoose";
import { UserModel } from "../../basic_modules/user/user.model";
import { role, CUSTOMER_ROLE_SET } from "../../../utils/role";
import {
  BugStageModel,
  ProjectBugModel,
  ProjectModel,
  ProjectTaskModel,
  TaskStageModel,
} from "./project.model";
import { formatProjectResponse, mapAssignedUsers } from "./project.utils";

const completedTaskFilter = async (userId: string) => {
  const completeStages = await TaskStageModel.find({
    user_id: userId,
    complete: true,
    isDeleted: false,
  }).select("_id");
  return { stage_id: { $in: completeStages.map((s) => s._id) } };
};

const getAssigneeFilter = (userId: Types.ObjectId) => ({
  assigned_to: userId,
});

const mapRecentTask = async (
  task: {
    _id: Types.ObjectId;
    title: string;
    priority?: string;
    assigned_to: Types.ObjectId[];
    createdAt?: Date;
    project_id: Types.ObjectId;
    stage_id?: Types.ObjectId;
  },
  userId: string
) => {
  const project = await ProjectModel.findById(task.project_id).select("name");
  const stage = task.stage_id
    ? await TaskStageModel.findById(task.stage_id).select("name color complete")
    : null;
  const assignees = await mapAssignedUsers(task.assigned_to);
  return formatProjectResponse({
    _id: task._id,
    title: task.title,
    priority: task.priority ?? "Medium",
    project: project?.name ?? "No Project",
    stage: stage?.name ?? "No Stage",
    stage_color: stage?.color ?? null,
    assignee: assignees.length ? assignees.map((a) => a.name).join(", ") : "Unassigned",
    created_at: task.createdAt ? moment(task.createdAt).format("MMM DD, YYYY") : "",
    is_completed: stage?.complete ?? false,
  });
};

const companyDashboard = async (userId: string) => {
  const totalProjects = await ProjectModel.countDocuments({ user_id: userId, isDeleted: false });
  const totalTasks = await ProjectTaskModel.countDocuments({ user_id: userId, isDeleted: false });
  const totalBugs = await ProjectBugModel.countDocuments({ user_id: userId, isDeleted: false });
  const totalUsers = await UserModel.countDocuments({
    companyId: userId,
    role: role.staff,
    isDeleted: false,
  });
  const totalClients = await UserModel.countDocuments({
    companyId: userId,
    role: { $in: [...CUSTOMER_ROLE_SET] },
    isDeleted: false,
  });

  const completedFilter = await completedTaskFilter(userId);
  const completedTasks = await ProjectTaskModel.countDocuments({
    user_id: userId,
    isDeleted: false,
    ...completedFilter,
  });

  const recentRaw = await ProjectTaskModel.find({ user_id: userId, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(8);
  const recentTasks = await Promise.all(recentRaw.map((t) => mapRecentTask(t, userId)));

  const projectStatus = [
    {
      name: "Ongoing",
      value: await ProjectModel.countDocuments({ user_id: userId, status: "Ongoing", isDeleted: false }),
      color: "#3b82f6",
    },
    {
      name: "Finished",
      value: await ProjectModel.countDocuments({ user_id: userId, status: "Finished", isDeleted: false }),
      color: "#10b77f",
    },
    {
      name: "On Hold",
      value: await ProjectModel.countDocuments({ user_id: userId, status: "Onhold", isDeleted: false }),
      color: "#f59e0b",
    },
  ];

  const taskPriority = [
    {
      name: "High",
      value: await ProjectTaskModel.countDocuments({ user_id: userId, priority: "High", isDeleted: false }),
      color: "#ef4444",
    },
    {
      name: "Medium",
      value: await ProjectTaskModel.countDocuments({ user_id: userId, priority: "Medium", isDeleted: false }),
      color: "#f59e0b",
    },
    {
      name: "Low",
      value: await ProjectTaskModel.countDocuments({ user_id: userId, priority: "Low", isDeleted: false }),
      color: "#10b77f",
    },
  ];

  const staff = await UserModel.find({ companyId: userId, role: role.staff, isDeleted: false }).select(
    "name"
  );
  const teamPerformance = (
    await Promise.all(
      staff.map(async (user) => {
        const uid = user._id as Types.ObjectId;
        const totalTasks = await ProjectTaskModel.countDocuments({
          user_id: userId,
          isDeleted: false,
          ...getAssigneeFilter(uid),
        });
        const completedTasks = await ProjectTaskModel.countDocuments({
          user_id: userId,
          isDeleted: false,
          ...getAssigneeFilter(uid),
          ...completedFilter,
        });
        return {
          name: user.name,
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        };
      })
    )
  )
    .filter((u) => u.total_tasks > 0)
    .slice(0, 6);

  const monthlyProgress: { month: string; created: number; completed: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = moment().subtract(i, "months");
    const created = await ProjectTaskModel.countDocuments({
      user_id: userId,
      isDeleted: false,
      createdAt: {
        $gte: date.clone().startOf("month").toDate(),
        $lte: date.clone().endOf("month").toDate(),
      },
    });
    const completed = await ProjectTaskModel.countDocuments({
      user_id: userId,
      isDeleted: false,
      ...completedFilter,
      updatedAt: {
        $gte: date.clone().startOf("month").toDate(),
        $lte: date.clone().endOf("month").toDate(),
      },
    });
    monthlyProgress.push({ month: date.format("MMM"), created, completed });
  }

  const overdueProjects = await ProjectModel.countDocuments({
    user_id: userId,
    isDeleted: false,
    end_date: { $lt: new Date() },
    status: { $ne: "Finished" },
  });

  const bugStages = await BugStageModel.find({
    user_id: userId,
    complete: true,
    isDeleted: false,
  }).select("_id");
  const resolvedBugs = await ProjectBugModel.countDocuments({
    user_id: userId,
    isDeleted: false,
    stage_id: { $in: bugStages.map((s) => s._id) },
  });

  return formatProjectResponse({
    stats: {
      total_projects: totalProjects,
      total_tasks: totalTasks,
      total_bugs: totalBugs,
      total_users: totalUsers,
      total_clients: totalClients,
      completed_tasks: completedTasks,
      completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      overdue_projects: overdueProjects,
    },
    recentTasks,
    projectStatus,
    taskPriority,
    teamPerformance,
    monthlyProgress,
    bugStats: {
      open: totalBugs - resolvedBugs,
      resolved: resolvedBugs,
    },
  });
};

export const dashboardService = {
  home: companyDashboard,
};
