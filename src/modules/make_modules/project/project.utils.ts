import httpStatus from "http-status";
import moment from "moment";
import { Types } from "mongoose";
import AppError from "../../../errors/AppError";
import { UserModel } from "../../basic_modules/user/user.model";
import { role, CUSTOMER_ROLE_SET } from "../../../utils/role";
import {
  BugStageModel,
  ProjectModel,
  TaskStageModel,
} from "./project.model";
import { ProjectActivityLogModel } from "./project.model";
import { IUser } from "../../basic_modules/user/user.interface";
import { AuthRequest } from "../../../middlewares/auth";

/** Company owner id on every create/update body (proposal pattern). */
export const applyCompanyUserToBody = (req: AuthRequest) => {
  if (req.user?._id) {
    req.body.user_id = req.user._id;
  }
};

export const companyObjectId = (userId: string | Types.ObjectId) =>
  userId instanceof Types.ObjectId ? userId : new Types.ObjectId(String(userId));

export const formatDate = (d?: Date | null): string | null => {
  if (!d) return null;
  return moment(d).format("Y-MM-DD");
};

export const fileUrl = (req: { protocol: string; get: (n: string) => string | undefined }, path: string) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${req.protocol}://${req.get("host")}${normalized}`;
};

export const mapUser = (user: { _id: Types.ObjectId; name?: string; email?: string; image?: string }, req?: { protocol: string; get: (n: string) => string | undefined }) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.image && req ? fileUrl(req, user.image.startsWith("/") ? user.image : `/images/${user.image}`) : user.image || null,
});

/** Project API responses use `_id` only (never `id`). Renames `id` → `_id` recursively. */
export const formatProjectResponse = <T>(payload: T): T => {
  const transform = (value: unknown): unknown => {
    if (value === null || value === undefined) return value;
    if (value instanceof Types.ObjectId) return value;
    if (value instanceof Date) return value;
    if (Array.isArray(value)) return value.map(transform);

    if (typeof value === "object") {
      const source =
        typeof (value as { toObject?: () => unknown }).toObject === "function"
          ? (value as { toObject: () => Record<string, unknown> }).toObject()
          : { ...(value as Record<string, unknown>) };

      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(source)) {
        if (key === "__v") continue;
        if (key === "id") {
          result._id = transform(val);
          continue;
        }
        result[key] = transform(val);
      }
      return result;
    }
    return value;
  };
  return transform(payload) as T;
};

export const refShape = (doc: { _id: Types.ObjectId; name?: string; title?: string }) =>
  formatProjectResponse({
    _id: doc._id,
    ...(doc.name !== undefined ? { name: doc.name } : {}),
    ...(doc.title !== undefined ? { title: doc.title } : {}),
  });

export const parseDuration = (duration?: string) => {
  if (!duration || !duration.includes(" - ")) {
    return { start_date: null as string | null, end_date: null as string | null };
  }
  const [start, end] = duration.split(" - ").map((s) => s.trim());
  return { start_date: start || null, end_date: end || null };
};

export const assertProject = async (projectId: string, userId: string) => {
  const project = await ProjectModel.findOne({
    _id: projectId,
    user_id: userId,
    isDeleted: false,
  });
  if (!project) {
    throw new AppError(httpStatus.NOT_FOUND, "Project not found");
  }
  return project;
};

export const logProjectActivity = async (
  userId: Types.ObjectId,
  projectId: Types.ObjectId,
  logType: string,
  remark: Record<string, unknown> | string
) => {
  await ProjectActivityLogModel.create({
    user_id: userId,
    project_id: projectId,
    log_type: logType,
    remark,
  });
};

export const formatActivityRemark = async (log: {
  log_type: string;
  remark: Record<string, unknown> | string;
  user_id: Types.ObjectId;
}) => {
  const actor = await UserModel.findById(log.user_id).select("name");
  const userName = actor?.name || "";
  const remark =
    typeof log.remark === "string"
      ? (() => {
          try {
            return JSON.parse(log.remark) as Record<string, unknown>;
          } catch {
            return log.remark;
          }
        })()
      : log.remark;

  if (typeof remark !== "object" || remark === null) {
    return String(remark);
  }

  const r = remark as Record<string, unknown>;
  switch (log.log_type) {
    case "Upload File":
      return `${userName} Upload new file ${r.file_name ?? ""}`;
    case "Create Bug":
      return `${userName} Create new Bug ${r.title ?? ""}`;
    case "Move Bug":
      return `${userName} Move Bug ${r.title ?? ""} from ${r.old_status ?? ""} to ${r.new_status ?? ""}`;
    case "Invite User": {
      const u = r.user_id ? await UserModel.findById(r.user_id).select("name") : null;
      return `${userName} Invite new User ${u?.name ?? ""}`;
    }
    case "Share with Client": {
      const c = r.client_id ? await UserModel.findById(r.client_id).select("name") : null;
      return `${userName} Share Project with Client ${c?.name ?? ""}`;
    }
    case "Create Task":
      return `${userName} Create new Task ${r.title ?? ""}`;
    case "Move":
      return `${userName} Move Task ${r.title ?? ""} from ${r.old_status ?? ""} to ${r.new_status ?? ""}`;
    case "Create Milestone":
      return `${userName} Create new Milestone ${r.title ?? ""}`;
    default:
      return JSON.stringify(remark);
  }
};

export const ensureDefaultTaskStages = async (userId: string, creatorId: Types.ObjectId) => {
  const count = await TaskStageModel.countDocuments({ user_id: userId, isDeleted: false });
  if (count > 0) return;
  const defaults: { color: string; name: string }[] = [
    { color: "#77b6ea", name: "Todo" },
    { color: "#545454", name: "In Progress" },
    { color: "#3cb8d9", name: "Review" },
    { color: "#37b37e", name: "Done" },
  ];
  const last = defaults.length - 1;
  await TaskStageModel.insertMany(
    defaults.map((s, i) => ({
      user_id: userId,
      creator_id: creatorId,
      name: s.name,
      color: s.color,
      complete: i === last,
      order: i,
      isDeleted: false,
    }))
  );
};

export const ensureDefaultBugStages = async (userId: string, creatorId: Types.ObjectId) => {
  const count = await BugStageModel.countDocuments({ user_id: userId, isDeleted: false });
  if (count > 0) return;
  const defaults: { color: string; name: string }[] = [
    { color: "#77b6ea", name: "Confirmed" },
    { color: "#545454", name: "In Progress" },
    { color: "#3cb8d9", name: "Resolved" },
    { color: "#37b37e", name: "Verified" },
  ];
  const last = defaults.length - 1;
  await BugStageModel.insertMany(
    defaults.map((s, i) => ({
      user_id: userId,
      creator_id: creatorId,
      name: s.name,
      color: s.color,
      complete: i === last,
      order: i,
      isDeleted: false,
    }))
  );
};

export const getStaffUsers = async (companyId: string) => {
  return UserModel.find({
    companyId,
    role: role.staff,
    isDeleted: false,
  }).select("name email role image");
};

export const getClientUsers = async (ids?: string[]) => {
  const filter: Record<string, unknown> = {
    role: { $in: [...CUSTOMER_ROLE_SET] },
    isDeleted: false,
  };
  if (ids?.length) filter._id = { $in: ids };
  return UserModel.find(filter).select("name email role image");
};

export const mapAssignedUsers = async (
  assignedIds: Types.ObjectId[],
  req?: { protocol: string; get: (n: string) => string | undefined }
) => {
  if (!assignedIds?.length) return [];
  const users = await UserModel.find({ _id: { $in: assignedIds } }).select("name email image");
  return users.map((u) => mapUser(u, req));
};

/** Normalize POST body / query for shared queryBuilder (searchTerm, sort, page, limit). */
export const toListQuery = (input: Record<string, unknown>) => {
  const query = { ...input };
  if (query.search && !query.searchTerm) {
    query.searchTerm = query.search;
  }
  if (
    query.status &&
    ["High", "Medium", "Low"].includes(String(query.status)) &&
    !query.priority
  ) {
    query.priority = query.status;
    delete query.status;
  }
  return query;
};

export type CompanyAuth = { _id: Types.ObjectId } & IUser;
