/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import { AuthRequest } from "../../../../middlewares/auth";
import { DealModel } from "../../crm/deal/deal.model";
import { LeadModel } from "../../crm/lead/lead.model";
import { DealStageModel } from "../../crm/dealStage/dealStage.model";
import { PipelineModel } from "../../crm/pipeline/pipeline.model";
import {
  actorRole,
  companyObjectId,
  countCompanyUsers,
  resolveActorUserId,
  resolveCompanyId,
  ROLE,
} from "../dashboard.utils";

const crmScope = (companyId: string) => ({
  user_id: companyObjectId(companyId),
  isDeleted: false,
});

const buildCalendarFromDeals = (deals: any[]) => {
  const events: any[] = [];
  for (const deal of deals) {
    for (const task of deal.tasks || []) {
      if (!task?.date) continue;
      const done = taskCompleted(task.status);
      events.push({
        id: task._id,
        title: task.name,
        startDate: String(task.date).slice(0, 10),
        endDate: String(task.date).slice(0, 10),
        time: task.time || "09:00",
        status: done ? "completed" : "pending",
        name: deal.name,
        color: done ? "#10b77f" : "#f59e0b",
      });
    }
  }
  return events;
};

const taskCompleted = (status?: unknown) => status === "Completed";

const countEmbeddedCalls = async (model: typeof DealModel | typeof LeadModel, match: Record<string, unknown>) => {
  const r = await model.aggregate([
    { $match: match },
    { $project: { n: { $size: { $ifNull: ["$calls", []] } } } },
    { $group: { _id: null, total: { $sum: "$n" } } },
  ]);
  return r[0]?.total || 0;
};

const formatRecentDeal = (deal: any) => ({
  id: deal._id,
  name: deal.name,
  price: deal.price ?? 0,
  status: deal.status,
  created_at: deal.createdAt,
  stage: deal.stage_id
    ? { id: deal.stage_id._id, name: deal.stage_id.name }
    : null,
});

const formatRecentLead = (lead: any) => ({
  id: lead._id,
  name: lead.name,
  subject: lead.subject,
  created_at: lead.createdAt,
});

/* ----------------------------- COMPANY ----------------------------- */
const companyDashboard = async (companyId: string, pipelineId?: string) => {
  const scope = crmScope(companyId);

  const [totalLeads, totalDeals, totalUsers, totalClients] = await Promise.all([
    LeadModel.countDocuments(scope),
    DealModel.countDocuments(scope),
    countCompanyUsers(companyId, ROLE.staff),
    countCompanyUsers(companyId, ROLE.customer),
  ]);

  const [recentDealsRaw, recentLeadsRaw, allDealsForCalendar, totalDealCalls, totalLeadCalls, pipelines] =
    await Promise.all([
      DealModel.find(scope).populate("stage_id", "name").sort({ createdAt: -1 }).limit(5).lean(),
      LeadModel.find(scope).sort({ createdAt: -1 }).limit(5).select("name subject createdAt").lean(),
      DealModel.find(scope).select("name tasks").lean(),
      countEmbeddedCalls(DealModel, scope),
      countEmbeddedCalls(LeadModel, scope),
      PipelineModel.find(scope).select("name").lean(),
    ]);

  const dealCallsChart: { name: string; value: number }[] = [];
  if (totalDealCalls > 0) dealCallsChart.push({ name: "Deal Calls", value: totalDealCalls });
  if (totalLeadCalls > 0) dealCallsChart.push({ name: "Lead Calls", value: totalLeadCalls });

  const stageFilter: Record<string, unknown> = { ...scope };
  if (pipelineId && Types.ObjectId.isValid(pipelineId)) {
    stageFilter.pipeline_id = companyObjectId(pipelineId);
  }

  const dealStages = await DealStageModel.find(stageFilter).sort({ order: 1 }).lean();
  const dealStageChart = await Promise.all(
    dealStages.map(async (stage) => ({
      name: stage.name,
      deals: await DealModel.countDocuments({ ...scope, stage_id: stage._id }),
    })),
  );

  return {
    message: "Lead Dashboard - Manage your leads and deals efficiently.",
    stats: {
      total_leads: totalLeads,
      total_deals: totalDeals,
      total_users: totalUsers,
      total_clients: totalClients,
    },
    recentDeals: recentDealsRaw.map(formatRecentDeal),
    recentLeads: recentLeadsRaw.map(formatRecentLead),
    calendarEvents: buildCalendarFromDeals(allDealsForCalendar),
    dealCallsChart,
    dealStageChart,
    pipelines: pipelines.map((p) => ({ id: p._id, name: p.name })),
  };
};

/* ----------------------------- CLIENT ----------------------------- */
const clientDashboard = async (companyId: string, userId: string) => {
  const scope = crmScope(companyId);
  const uid = companyObjectId(userId);
  const clientFilter = { ...scope, clients: uid };

  const deals = await DealModel.find(clientFilter).lean();
  const totalDeals = deals.length;
  const activeDealCount = deals.filter((d) => d.status === "Active").length;
  const wonDealCount = deals.filter((d) => d.status === "Won").length;
  const lossDealCount = deals.filter((d) => d.status === "Lost" || d.status === "Loss").length;
  const totalDealValue = deals.reduce((sum, d) => sum + (d.price || 0), 0);

  const recentDealsRaw = await DealModel.find(clientFilter)
    .populate("stage_id", "name")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const calendarDeals = await DealModel.find(clientFilter).select("name tasks").lean();

  return {
    message: "Client Dashboard - View your assigned deals.",
    stats: {
      total_deals: totalDeals,
      active_deals: activeDealCount,
      won_deals: wonDealCount,
      total_value: totalDealValue,
    },
    recentDeals: recentDealsRaw.map(formatRecentDeal),
    calendarEvents: buildCalendarFromDeals(calendarDeals),
    dealStatusChart: [
      { name: "Active", value: activeDealCount },
      { name: "Won", value: wonDealCount },
      { name: "Loss", value: lossDealCount },
    ],
  };
};

/* ----------------------------- STAFF / USER ----------------------------- */
const userDashboard = async (companyId: string, userId: string) => {
  const scope = crmScope(companyId);
  const uid = companyObjectId(userId);

  const [assignedDealsList, assignedLeadsList] = await Promise.all([
    DealModel.find({ ...scope, assigned_users: uid }).lean(),
    LeadModel.find({ ...scope, assigned_users: uid }).lean(),
  ]);

  const assignedDeals = assignedDealsList.length;
  const assignedLeads = assignedLeadsList.length;

  let completedTasks = 0;
  let pendingTasks = 0;
  for (const deal of assignedDealsList) {
    for (const task of deal.tasks || []) {
      if (taskCompleted(task.status)) completedTasks += 1;
      else pendingTasks += 1;
    }
  }
  for (const lead of assignedLeadsList) {
    for (const task of lead.tasks || []) {
      if (taskCompleted(task.status)) completedTasks += 1;
      else pendingTasks += 1;
    }
  }

  const totalAmount = assignedDealsList.reduce((sum, d) => sum + (d.price || 0), 0);

  const [recentDealsRaw, recentLeadsRaw, calendarDeals] = await Promise.all([
    DealModel.find({ ...scope, assigned_users: uid })
      .populate("stage_id", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    LeadModel.find({ ...scope, assigned_users: uid })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name subject createdAt")
      .lean(),
    DealModel.find({ ...scope, assigned_users: uid }).select("name tasks").lean(),
  ]);

  return {
    message: "User Dashboard - View your assigned leads and deals.",
    stats: {
      assigned_deals: assignedDeals,
      assigned_leads: assignedLeads,
      completed_tasks: completedTasks,
      pending_tasks: pendingTasks,
      total_amount: totalAmount,
    },
    recentDeals: recentDealsRaw.map(formatRecentDeal),
    recentLeads: recentLeadsRaw.map(formatRecentLead),
    calendarEvents: buildCalendarFromDeals(calendarDeals),
    taskStatusChart: [
      { name: "Completed", value: completedTasks },
      { name: "Pending", value: pendingTasks },
    ],
  };
};

const getDashboard = async (req: AuthRequest) => {
  const companyId = resolveCompanyId(req);
  const userId = resolveActorUserId(req);
  const type = actorRole(req);
  const pipelineId = typeof req.query.pipeline_id === "string" ? req.query.pipeline_id : undefined;

  if (type === ROLE.company || type === ROLE.superadmin) return companyDashboard(companyId, pipelineId);
  if (type === ROLE.customer) return clientDashboard(companyId, userId);
  return userDashboard(companyId, userId);
};

export const crmDashboardService = { getDashboard };
