/* eslint-disable @typescript-eslint/no-explicit-any */
import { FilterQuery } from "mongoose";
import { AuthRequest } from "../../../../middlewares/auth";
import { hasPermission } from "../../hrm/shared/hrm.utils";
import { FaqModel } from "../../support/faq/faq.model";
import { KnowledgeModel } from "../../support/knowledge/knowledge.model";
import { TicketCategoryModel } from "../../support/ticketCategory/ticketCategory.model";
import { TicketModel } from "../../support/ticket/ticket.model";
import { P } from "../../support/shared/support.permissions";
import {
  applyTicketOwnershipToQuery,
  companyObjectId,
  companyScope,
  resolveActorUserId,
  resolveCompanyId,
  resolveSupportOwnership,
} from "../../support/shared/support.utils";
import { actorRole, ROLE } from "../dashboard.utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const STATUS_COLORS: Record<string, string> = {
  "In Progress": "#F59E0B",
  "On Hold": "#EF4444",
  Closed: "#10b77f",
};

const DEFAULT_CATEGORY_COLORS = ["#3B82F6", "#10b77f", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4", "#84CC16", "#F97316"];

const fmtTicketDate = (d?: Date) =>
  d
    ? new Date(d).toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";

const emptyMonthly = () =>
  Object.fromEntries(MONTHS.map((m) => [m, { created: 0, resolved: 0 }])) as Record<
    string,
    { created: number; resolved: number }
  >;

const oneYearAgo = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

const formatRecentTicket = (ticket: any) => ({
  id: ticket._id,
  ticket_id: ticket.ticket_id,
  name: ticket.name,
  email: ticket.email,
  subject: ticket.subject,
  status: ticket.status,
  category:
    ticket.category && typeof ticket.category === "object" && "name" in ticket.category
      ? ticket.category.name
      : "No Category",
  created_at: fmtTicketDate(ticket.createdAt),
});

const statusChartFromCounts = (statusData: Record<string, number>) =>
  Object.entries(statusData).map(([status, count]) => ({
    name: status,
    value: count,
    color: STATUS_COLORS[status] ?? "#6B7280",
  }));

const monthlyFromTickets = async (match: FilterQuery<any>) => {
  const rows = await TicketModel.aggregate([
    { $match: { ...match, createdAt: { $gt: oneYearAgo() } } },
    {
      $group: {
        _id: { $month: "$createdAt" },
        total: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "Closed"] }, 1, 0] } },
      },
    },
  ]);
  const byMonth = new Map<number, { total: number; resolved: number }>(
    rows.map((r) => [r._id as number, { total: r.total as number, resolved: r.resolved as number }]),
  );
  const result = emptyMonthly();
  MONTHS.forEach((label, index) => {
    const v = byMonth.get(index + 1);
    result[label] = { created: v?.total ?? 0, resolved: v?.resolved ?? 0 };
  });
  return result;
};

const statusCounts = async (match: FilterQuery<any>) => {
  const rows = await TicketModel.aggregate([
    { $match: match },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const out: Record<string, number> = {};
  for (const row of rows) out[String(row._id)] = row.count;
  return out;
};

const resolveSlug = (companyId: string) => String(companyId);

/* ----------------------------- COMPANY ----------------------------- */
const companyDashboard = async (companyId: string) => {
  const scope = companyScope(companyId);
  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const [ticketAgg, categories, knowledgeBase, faqs, recentRaw, monthlyData, chartRows, statusRaw] =
    await Promise.all([
      TicketModel.aggregate([
        { $match: scope },
        {
          $group: {
            _id: null,
            total_tickets: { $sum: 1 },
            open_tickets: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
            closed_tickets: { $sum: { $cond: [{ $eq: ["$status", "Closed"] }, 1, 0] } },
            today_tickets: {
              $sum: {
                $cond: [{ $and: [{ $gte: ["$createdAt", todayStart] }, { $lte: ["$createdAt", todayEnd] }] }, 1, 0],
              },
            },
            avg_response_time: {
              $avg: { $divide: [{ $subtract: ["$updatedAt", "$createdAt"] }, 3600000] },
            },
          },
        },
      ]),
      TicketCategoryModel.countDocuments(scope),
      KnowledgeModel.countDocuments(scope),
      FaqModel.countDocuments(scope),
      TicketModel.find(scope)
        .populate("category", "name color")
        .sort({ createdAt: -1 })
        .limit(5)
        .select("ticket_id name email subject status category createdAt")
        .lean(),
      monthlyFromTickets(scope),
      TicketModel.aggregate([
        { $match: { ...scope, category: { $exists: true, $ne: null } } },
        { $group: { _id: "$category", total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        {
          $lookup: {
            from: TicketCategoryModel.collection.name,
            localField: "_id",
            foreignField: "_id",
            as: "cat",
          },
        },
        { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
      ]),
      statusCounts(scope),
    ]);

  const t = ticketAgg[0] || {};
  const totalTickets = t.total_tickets || 0;
  const closedTickets = t.closed_tickets || 0;
  const avgResponseTime = Math.round((t.avg_response_time || 0) * 10) / 10;

  let chartData = chartRows.map((row: any, index: number) => ({
    name: row.cat?.name || "No Category",
    value: row.total,
    color: row.cat?.color || DEFAULT_CATEGORY_COLORS[index % DEFAULT_CATEGORY_COLORS.length],
  }));

  if (chartData.length === 0) {
    chartData = [{ name: "No Data", value: 1, color: "#e3e3e3" }];
  }

  const statusData = statusChartFromCounts(statusRaw);

  return {
    stats: {
      totalTickets,
      categories,
      openTickets: t.open_tickets || 0,
      closedTickets,
      todayTickets: t.today_tickets || 0,
      avgResponseTime,
      resolutionRate: totalTickets > 0 ? Math.round((closedTickets / totalTickets) * 1000) / 10 : 0,
      knowledgeBase,
      faqs,
    },
    chartData,
    monthlyData,
    recentTickets: recentRaw.map(formatRecentTicket),
    statusData,
    slug: resolveSlug(companyId),
  };
};

/* ----------------------------- CLIENT / VENDOR ----------------------------- */
const portalUserDashboard = async (companyId: string, userId: string) => {
  const match = { ...companyScope(companyId), ticket_user_id: companyObjectId(userId) };
  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const [ticketAgg, monthlyData, recentRaw, statusRaw] = await Promise.all([
    TicketModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total_tickets: { $sum: 1 },
          open_tickets: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
          closed_tickets: { $sum: { $cond: [{ $eq: ["$status", "Closed"] }, 1, 0] } },
          today_tickets: {
            $sum: {
              $cond: [{ $and: [{ $gte: ["$createdAt", todayStart] }, { $lte: ["$createdAt", todayEnd] }] }, 1, 0],
            },
          },
        },
      },
    ]),
    monthlyFromTickets(match),
    TicketModel.find(match)
      .populate("category", "name color")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("ticket_id name email subject status category createdAt")
      .lean(),
    statusCounts(match),
  ]);

  const t = ticketAgg[0] || {};
  const totalTickets = t.total_tickets || 0;
  const closedTickets = t.closed_tickets || 0;

  return {
    stats: {
      totalTickets,
      openTickets: t.open_tickets || 0,
      closedTickets,
      todayTickets: t.today_tickets || 0,
      resolutionRate: totalTickets > 0 ? Math.round((closedTickets / totalTickets) * 1000) / 10 : 0,
    },
    monthlyData,
    recentTickets: recentRaw.map(formatRecentTicket),
    statusData: statusChartFromCounts(statusRaw),
    slug: resolveSlug(companyId),
  };
};

/* ----------------------------- STAFF ----------------------------- */
const staffDashboard = async (req: AuthRequest, companyId: string) => {
  const user = req.user!;
  const canViewTickets = hasPermission(user, P.ticket.view_support_tickets);
  const ownership = resolveSupportOwnership(req, P.ticket.manage_any_support_tickets, P.ticket.manage_own_support_tickets);

  if (!canViewTickets) {
    return {
      stats: {
        totalTickets: 0,
        openTickets: 0,
        closedTickets: 0,
        todayTickets: 0,
        resolutionRate: 0,
        canViewTickets: false,
      },
      monthlyData: emptyMonthly(),
      recentTickets: [],
      statusData: [],
      slug: resolveSlug(companyId),
    };
  }

  const base = applyTicketOwnershipToQuery(companyScope(companyId), ownership);
  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const monthlyData = ownership.canManageAny
    ? await monthlyFromTickets(companyScope(companyId))
    : await monthlyFromTickets(base);

  const [ticketAgg, recentRaw, statusRaw] = await Promise.all([
    TicketModel.aggregate([
      { $match: base },
      {
        $group: {
          _id: null,
          total_tickets: { $sum: 1 },
          open_tickets: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
          closed_tickets: { $sum: { $cond: [{ $eq: ["$status", "Closed"] }, 1, 0] } },
          today_tickets: {
            $sum: {
              $cond: [{ $and: [{ $gte: ["$createdAt", todayStart] }, { $lte: ["$createdAt", todayEnd] }] }, 1, 0],
            },
          },
        },
      },
    ]),
    TicketModel.find(base)
      .populate("category", "name color")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("ticket_id name email subject status category createdAt")
      .lean(),
    statusCounts(base),
  ]);

  const t = ticketAgg[0] || {};
  const totalTickets = t.total_tickets || 0;
  const closedTickets = t.closed_tickets || 0;

  return {
    stats: {
      totalTickets,
      openTickets: t.open_tickets || 0,
      closedTickets,
      todayTickets: t.today_tickets || 0,
      resolutionRate: totalTickets > 0 ? Math.round((closedTickets / totalTickets) * 1000) / 10 : 0,
      canViewTickets: true,
    },
    monthlyData,
    recentTickets: recentRaw.map(formatRecentTicket),
    statusData: statusChartFromCounts(statusRaw),
    slug: resolveSlug(companyId),
  };
};

const getDashboard = async (req: AuthRequest) => {
  const companyId = resolveCompanyId(req);
  const userId = resolveActorUserId(req);
  const type = actorRole(req);

  if (type === ROLE.company || type === ROLE.superadmin) return companyDashboard(companyId);
  if (type === ROLE.customer || type === ROLE.vendor) return portalUserDashboard(companyId, userId);
  return staffDashboard(req, companyId);
};

export const supportDashboardService = { getDashboard };
