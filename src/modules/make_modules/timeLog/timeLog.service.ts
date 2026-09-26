/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuthRequest } from "../../../middlewares/auth";
import { TimeLogModel, TTimeLog } from "./timeLog.model";

const companyId = (req: AuthRequest): string => {
  const user = req.user as any;
  if (user?.role === "company" || user?.role === "superadmin") return String(user._id);
  if (user?.companyId) return String(user.companyId);
  return String(user?._id);
};

const format = (doc: any) => ({
  id: String(doc._id),
  date: doc.date,
  details: doc.details ?? "",
  project: doc.project_id?.name ?? doc.project_name ?? "",
  task: doc.task_name ?? "",
  notes: doc.notes ?? "",
  hours: doc.hours ?? 0,
  user: doc.creator_id?.email ?? doc.creator_id?.name ?? "",
  active: doc.is_active ?? true,
  created_at: doc.createdAt,
  // Timesheet fields. Additive — the Time Logs screen reads the keys above and
  // ignores these.
  type: doc.type ?? "manual",
  minutes: doc.minutes ?? 0,
  employee_id: doc.employee_id?._id
    ? String(doc.employee_id._id)
    : doc.employee_id
      ? String(doc.employee_id)
      : "",
  employee_name: doc.employee_id?.name ?? doc.employee_name ?? "",
});

const createDB = async (req: AuthRequest, payload: TTimeLog) => {
  const uid = companyId(req);
  const doc = await TimeLogModel.create({
    ...payload,
    user_id: uid,
    creator_id: (req.user as any)?._id ?? uid,
  });
  const populated = await TimeLogModel.findById(doc._id)
    .populate("project_id", "name")
    .populate("creator_id", "name email")
    .populate("employee_id", "name email")
    .lean();
  return format(populated);
};

const getAllDB = async (req: AuthRequest) => {
  const uid = companyId(req);
  const rows = await TimeLogModel.find({ user_id: uid, isDeleted: false })
    .populate("project_id", "name")
    .populate("creator_id", "name email")
    .populate("employee_id", "name email")
    .sort({ date: -1, createdAt: -1 })
    .lean();
  return rows.map(format);
};

const updateDB = async (req: AuthRequest, id: string, payload: Partial<TTimeLog>) => {
  const uid = companyId(req);
  const doc = await TimeLogModel.findOneAndUpdate(
    { _id: id, user_id: uid, isDeleted: false },
    payload,
    { new: true },
  )
    .populate("project_id", "name")
    .populate("creator_id", "name email")
    .populate("employee_id", "name email")
    .lean();
  return doc ? format(doc) : null;
};

const deleteDB = async (req: AuthRequest, id: string) => {
  const uid = companyId(req);
  // Supports single or comma-joined ids.
  const ids = String(id)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  await TimeLogModel.deleteMany({ _id: { $in: ids }, user_id: uid });
  return { deleted: ids.length };
};

export const timeLogService = { createDB, getAllDB, updateDB, deleteDB };
