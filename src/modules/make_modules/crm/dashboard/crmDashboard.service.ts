import { Types } from "mongoose";
import { DealModel } from "../deal/deal.model";
import { LeadModel } from "../lead/lead.model";
import { DealStageModel } from "../dealStage/dealStage.model";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PALETTE = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4"];

/** CRM overview: deal/lead counts, deals-by-stage, calls/leads per weekday, recents. */
const getDashboard = async (userId: string) => {
  const uid = new Types.ObjectId(userId);
  const scope = { user_id: uid, isDeleted: false };

  const [deals, leads, stages] = await Promise.all([
    DealModel.find(scope)
      .select("name stage_id clients assigned_users calls createdAt")
      .lean(),
    LeadModel.find(scope)
      .select("name subject notes assigned_users calls createdAt date")
      .lean(),
    DealStageModel.find({ user_id: uid }).select("name").lean(),
  ]);

  const stageName = new Map(stages.map((s: any) => [String(s._id), s.name]));

  // Stat cards.
  const clientSet = new Set<string>();
  const userSet = new Set<string>();
  for (const d of deals as any[]) {
    (d.clients || []).forEach((c: any) => clientSet.add(String(c)));
    (d.assigned_users || []).forEach((u: any) => userSet.add(String(u)));
  }
  for (const l of leads as any[]) {
    (l.assigned_users || []).forEach((u: any) => userSet.add(String(u)));
  }
  const stats = {
    total_deals: deals.length,
    total_leads: leads.length,
    total_users: userSet.size,
    total_clients: clientSet.size,
  };

  // Deals grouped by stage.
  const stageCount = new Map<string, number>();
  for (const d of deals as any[]) {
    const nm = stageName.get(String(d.stage_id)) || "Unassigned";
    stageCount.set(nm, (stageCount.get(nm) || 0) + 1);
  }
  const dealsByStage = [...stageCount.entries()].map(([name, value], i) => ({
    name,
    value,
    color: PALETTE[i % PALETTE.length],
  }));

  // Calls + leads per weekday.
  const byDay: Record<string, { calls: number; leads: number }> = Object.fromEntries(
    WEEK.map((d) => [d, { calls: 0, leads: 0 }]),
  );
  for (const l of leads as any[]) {
    const dt = l.createdAt || l.date;
    if (dt) byDay[DOW[new Date(dt).getDay()]].leads += 1;
  }
  for (const d of deals as any[]) {
    if (d.createdAt) byDay[DOW[new Date(d.createdAt).getDay()]].calls += d.calls?.length || 0;
  }
  const callsByDay = WEEK.map((day) => ({ day, calls: byDay[day].calls, leads: byDay[day].leads }));

  // Recents.
  const byNewest = (a: any, b: any) =>
    +new Date(b.createdAt || 0) - +new Date(a.createdAt || 0);
  const recentDeals = [...(deals as any[])].sort(byNewest).slice(0, 5).map((d) => ({
    name: d.name,
    stage: stageName.get(String(d.stage_id)) || "—",
    date: d.createdAt,
  }));
  const recentLeads = [...(leads as any[])].sort(byNewest).slice(0, 5).map((l) => ({
    name: l.name,
    project: l.subject || l.notes || "—",
    date: l.createdAt || l.date,
  }));

  return { stats, dealsByStage, callsByDay, recentDeals, recentLeads };
};

export const crmDashboardService = { getDashboard };
