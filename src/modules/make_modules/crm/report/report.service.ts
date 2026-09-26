/* eslint-disable @typescript-eslint/no-explicit-any */
import { LeadModel } from "../lead/lead.model";
import { DealModel } from "../deal/deal.model";
import { LeadStageModel } from "../leadStage/leadStage.model";
import { DealStageModel } from "../dealStage/dealStage.model";

const stageFilter = (user_id: string, query: Record<string, unknown>) => {
  const f: Record<string, unknown> = { user_id, isDeleted: false };
  if (query.pipeline_id) f.pipeline_id = query.pipeline_id;
  return f;
};

const entityFilter = (user_id: string, query: Record<string, unknown>) => {
  const f = stageFilter(user_id, query) as Record<string, unknown>;
  const from = query.from_date;
  const to = query.to_date;
  if (from || to) {
    const createdAt: Record<string, Date> = {};
    if (typeof from === "string" && from) createdAt.$gte = new Date(from);
    if (typeof to === "string" && to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      createdAt.$lte = end;
    }
    f.createdAt = createdAt;
  }
  return f;
};

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const nameOf = (ref: any): string => {
  if (!ref || typeof ref !== "object") return "";
  return (
    ref.name ||
    ref.companyName ||
    ref?.businessProfile?.companyName ||
    ref.email ||
    ""
  );
};

const weeklyFrom = (rows: any[]) => {
  const c: Record<string, number> = Object.fromEntries(WEEK_ORDER.map((d) => [d, 0]));
  for (const r of rows) {
    if (!r.createdAt) continue;
    c[DOW[new Date(r.createdAt).getDay()]]++;
  }
  return WEEK_ORDER.map((day) => ({ day, count: c[day] }));
};

const monthlyFrom = (rows: any[]) => {
  const c: Record<string, number> = Object.fromEntries(MONTHS.map((m) => [m, 0]));
  for (const r of rows) {
    if (!r.createdAt) continue;
    c[MONTHS[new Date(r.createdAt).getMonth()]]++;
  }
  return MONTHS.map((month) => ({ month, count: c[month] }));
};

const DOW_FULL: Record<string, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday",
  Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
};

/** Deals per weekday split by won/lost (for the deal-reports weekly chart). */
const weeklyWonLostFrom = (rows: any[]) => {
  const w: Record<string, { won: number; lost: number }> = Object.fromEntries(
    WEEK_ORDER.map((d) => [d, { won: 0, lost: 0 }]),
  );
  for (const r of rows) {
    const dt = r.createdAt;
    if (!dt) continue;
    const day = DOW[new Date(dt).getDay()];
    if (r.status === "Won") w[day].won++;
    else if (r.status === "Lost") w[day].lost++;
  }
  return WEEK_ORDER.map((day) => ({ day: DOW_FULL[day], won: w[day].won, lost: w[day].lost }));
};

/** Leads per weekday split by leads/conversions (lead-reports weekly chart). */
const weeklyLeadsConvFrom = (rows: any[]) => {
  const w: Record<string, { leads: number; conversions: number }> = Object.fromEntries(
    WEEK_ORDER.map((d) => [d, { leads: 0, conversions: 0 }]),
  );
  for (const r of rows) {
    if (!r.createdAt) continue;
    const day = DOW[new Date(r.createdAt).getDay()];
    w[day].leads++;
    if (r.is_converted) w[day].conversions++;
  }
  return WEEK_ORDER.map((day) => ({ day: DOW_FULL[day], leads: w[day].leads, conversions: w[day].conversions }));
};

/** Per assigned-user lead + conversion counts. */
const staffLeadsConvFrom = (rows: any[]) => {
  const m = new Map<string, { name: string; leads: number; conversions: number }>();
  for (const r of rows) {
    for (const ref of r.assigned_users || []) {
      const name = nameOf(ref);
      if (!name) continue;
      const e = m.get(name) || { name, leads: 0, conversions: 0 };
      e.leads++;
      if (r.is_converted) e.conversions++;
      m.set(name, e);
    }
  }
  return [...m.values()];
};

const countByRefs = (rows: any[], pick: (r: any) => any[]) => {
  const m = new Map<string, number>();
  for (const r of rows) {
    for (const ref of pick(r) || []) {
      const n = nameOf(ref);
      if (!n) continue;
      m.set(n, (m.get(n) || 0) + 1);
    }
  }
  return [...m.entries()].map(([name, count]) => ({ name, count }));
};

const leadReportsDB = async (user_id: string, query: Record<string, unknown>) => {
  const leads = await LeadModel.find(entityFilter(user_id, query))
    .populate("sources", "name")
    .populate("assigned_users", "name email")
    .populate("pipeline_id", "name")
    .lean();

  const total = leads.length;
  const converted = leads.filter((l) => l.is_converted).length;
  const active = leads.filter((l) => l.is_active && !l.is_converted).length;

  const counts: Record<string, number> = {};
  for (const l of leads) {
    const k = String(l.stage_id || "unassigned");
    counts[k] = (counts[k] || 0) + 1;
  }
  const stages = await LeadStageModel.find(stageFilter(user_id, query)).sort({ order: 1 }).lean();
  const byStage = stages.map((s) => ({ stage_id: s._id, name: s.name, count: counts[String(s._id)] || 0 }));

  const sources = countByRefs(leads, (l) => l.sources).map((x) => ({ source: x.name, count: x.count }));
  const staff = countByRefs(leads, (l) => l.assigned_users);

  // Per-pipeline: total leads vs converted.
  const plMap = new Map<string, { pipeline: string; total: number; leads: number }>();
  for (const l of leads as any[]) {
    const p = l.pipeline_id;
    const key = String(p?._id || p || "unassigned");
    const e = plMap.get(key) || { pipeline: nameOf(p) || "Unassigned", total: 0, leads: 0 };
    e.total++;
    if (l.is_converted) e.leads++;
    plMap.set(key, e);
  }

  return {
    total,
    converted,
    active,
    byStage,
    weekly: weeklyFrom(leads),
    weeklyDetailed: weeklyLeadsConvFrom(leads),
    monthly: monthlyFrom(leads),
    sources,
    staff,
    staffDetailed: staffLeadsConvFrom(leads),
    pipeline: [...plMap.values()],
  };
};

const dealReportsDB = async (user_id: string, query: Record<string, unknown>) => {
  const deals = await DealModel.find(entityFilter(user_id, query))
    .populate("sources", "name")
    .populate("assigned_users", "name email")
    .populate("clients", "name email businessProfile")
    .populate("pipeline_id", "name")
    .lean();

  const total = deals.length;
  const totalValue = deals.reduce((s, d) => s + (d.price || 0), 0);
  const won = deals.filter((d) => d.status === "Won").length;
  const lost = deals.filter((d) => d.status === "Lost").length;

  const counts: Record<string, number> = {};
  const values: Record<string, number> = {};
  for (const d of deals) {
    const k = String(d.stage_id || "unassigned");
    counts[k] = (counts[k] || 0) + 1;
    values[k] = (values[k] || 0) + (d.price || 0);
  }
  const stages = await DealStageModel.find(stageFilter(user_id, query)).sort({ order: 1 }).lean();
  const byStage = stages.map((s) => ({
    stage_id: s._id,
    name: s.name,
    count: counts[String(s._id)] || 0,
    value: values[String(s._id)] || 0,
  }));

  const sources = countByRefs(deals, (d) => d.sources).map((x) => ({ source: x.name, count: x.count }));
  const staff = countByRefs(deals, (d) => d.assigned_users);
  const client = countByRefs(deals, (d) => d.clients);

  const dpMap = new Map<string, { pipeline: string; count: number }>();
  for (const d of deals as any[]) {
    const p = d.pipeline_id;
    const key = String(p?._id || p || "unassigned");
    const e = dpMap.get(key) || { pipeline: nameOf(p) || "Unassigned", count: 0 };
    e.count++;
    dpMap.set(key, e);
  }

  return {
    total,
    totalValue,
    won,
    lost,
    byStage,
    weekly: weeklyFrom(deals),
    weeklyWonLost: weeklyWonLostFrom(deals),
    monthly: monthlyFrom(deals),
    sources,
    staff,
    client,
    pipeline: [...dpMap.values()],
  };
};

export const crmReportService = { leadReportsDB, dealReportsDB };
