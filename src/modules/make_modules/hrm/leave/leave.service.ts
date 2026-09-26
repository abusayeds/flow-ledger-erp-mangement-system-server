import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { HrmEmployeeModel, HrmLeaveApplicationModel, HrmLeaveTypeModel } from "../models";
import {
  applyOwnershipToQuery,
  companyObjectId,
  companyScope,
  creatorObjectId,
  parseDate,
  resolveActorUserId,
  formatUserRef,
  resolveCompanyId,
  resolveOwnership,
} from "../shared/hrm.utils";
import { AuthRequest } from "../../../../middlewares/auth";
import { employeeListSearchNested } from "../shared/hrm.employeeSearch";
import { permModule } from "../../../../utils/permissionModule";
import { parseObjectId } from "../shared/hrm.refValidation";
import { assertEnumValue, LEAVE_APPLICATION_STATUS } from "../shared/hrm.statusValidation";
import { withBulkDeleteAuthId } from "../../../../utils/bulkDelete";

const diffDays = (start: Date, end: Date) => {
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
};

const lean = (d: Record<string, unknown>) => ({ ...d, _id: d._id ? String(d._id) : undefined });

const currentYearRange = () => {
  const year = new Date().getFullYear();
  return {
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31, 23, 59, 59, 999),
  };
};

type LeaveBalanceSnapshot = {
  leave_type_id: string;
  leave_type_name: string;
  max_days_per_year: number;
  used_days: number;
  pending_days: number;
  balance: number;
};

/** Accepts User id or HrmEmployee profile id. */
const resolveEmployeeUserId = async (companyId: string, idOrProfileId: string) => {
  const scope = companyScope(companyId);
  const asUser = companyObjectId(idOrProfileId);
  const profile = await HrmEmployeeModel.findOne({
    ...scope,
    $or: [{ _id: asUser }, { employee_user_id: asUser }],
  })
    .select("employee_user_id")
    .lean();
  if (profile?.employee_user_id) return String(profile.employee_user_id);
  return idOrProfileId;
};

type LeaveUsageMap = Map<string, { used_days: number; pending_days: number }>;

const usageKey = (employeeUserId: string, leaveTypeId: string) => `${employeeUserId}|${leaveTypeId}`;

/** One aggregation: sum leave days per employee + leave type + status (current year). */
const aggregateLeaveUsage = async (
  companyId: string,
  opts?: { employeeUserIds?: string[]; excludeApplicationId?: string },
): Promise<LeaveUsageMap> => {
  const { start, end } = currentYearRange();
  const match: Record<string, unknown> = {
    user_id: companyScope(companyId).user_id,
    isDeleted: false,
    status: { $in: ["approved", "pending"] },
    $or: [
      { start_date: { $gte: start, $lte: end } },
      { end_date: { $gte: start, $lte: end } },
      { start_date: { $lte: start }, end_date: { $gte: end } },
    ],
  };
  if (opts?.employeeUserIds?.length) {
    match.employee_id = { $in: opts.employeeUserIds.map((id) => companyObjectId(id)) };
  }
  if (opts?.excludeApplicationId) {
    match._id = { $ne: companyObjectId(opts.excludeApplicationId) };
  }

  const rows = await HrmLeaveApplicationModel.aggregate<{
    _id: { employee_id: unknown; leave_type_id: unknown; status: string };
    total: number;
  }>([
    { $match: match },
    {
      $group: {
        _id: {
          employee_id: "$employee_id",
          leave_type_id: "$leave_type_id",
          status: "$status",
        },
        total: { $sum: { $ifNull: ["$total_days", 0] } },
      },
    },
  ]);

  const map: LeaveUsageMap = new Map();
  for (const row of rows) {
    const empId = String(row._id.employee_id);
    const typeId = String(row._id.leave_type_id);
    const key = usageKey(empId, typeId);
    const entry = map.get(key) ?? { used_days: 0, pending_days: 0 };
    if (row._id.status === "approved") entry.used_days += row.total;
    else if (row._id.status === "pending") entry.pending_days += row.total;
    map.set(key, entry);
  }
  return map;
};

const readUsage = (map: LeaveUsageMap, employeeUserId: string, leaveTypeId: string) =>
  map.get(usageKey(employeeUserId, leaveTypeId)) ?? { used_days: 0, pending_days: 0 };

type LeaveTypeRow = {
  _id: unknown;
  name: string;
  max_days_per_year?: number;
};

const snapshotFromType = (
  lt: LeaveTypeRow,
  employeeUserId: string,
  usageMap: LeaveUsageMap,
): LeaveBalanceSnapshot & { note?: string } => {
  const max = lt.max_days_per_year ?? 0;
  const { used_days, pending_days } = readUsage(usageMap, employeeUserId, String(lt._id));
  const balance = max > 0 ? Math.max(0, max - used_days - pending_days) : 0;
  return {
    leave_type_id: String(lt._id),
    leave_type_name: lt.name,
    max_days_per_year: max,
    used_days,
    pending_days,
    balance,
    ...(max <= 0 ? { note: "Annual limit not configured" } : {}),
  };
};

const buildEmployeeLeaveBalances = (
  employeeUserId: string,
  types: LeaveTypeRow[],
  usageMap: LeaveUsageMap,
) => types.map((lt) => snapshotFromType(lt, employeeUserId, usageMap));

const getLeaveTypeBalance = async (
  companyId: string,
  employeeUserId: string,
  leaveTypeId: string,
  excludeApplicationId?: string,
): Promise<LeaveBalanceSnapshot> => {
  const leaveType = await HrmLeaveTypeModel.findOne({
    _id: leaveTypeId,
    ...companyScope(companyId),
  }).lean();
  if (!leaveType) throw new AppError(httpStatus.NOT_FOUND, "Leave type not found");

  const max = leaveType.max_days_per_year ?? 0;
  if (max <= 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Leave type "${leaveType.name}" has no annual day limit configured`,
    );
  }

  const resolvedId = await resolveEmployeeUserId(companyId, employeeUserId);
  const usageMap = await aggregateLeaveUsage(companyId, {
    employeeUserIds: [resolvedId],
    excludeApplicationId,
  });
  return snapshotFromType(leaveType, resolvedId, usageMap);
};

const assertLeaveBalance = async (
  companyId: string,
  employeeUserId: string,
  leaveTypeId: string,
  requestedDays: number,
  excludeApplicationId?: string,
) => {
  const snapshot = await getLeaveTypeBalance(
    companyId,
    employeeUserId,
    leaveTypeId,
    excludeApplicationId,
  );
  if (requestedDays > snapshot.balance) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Insufficient leave balance for "${snapshot.leave_type_name}". ` +
        `Allocated: ${snapshot.max_days_per_year}, used: ${snapshot.used_days}, ` +
        `pending: ${snapshot.pending_days}, balance: ${snapshot.balance}, requested: ${requestedDays}`,
    );
  }
  return snapshot;
};

const removeOne = async (req: AuthRequest, oneId: string) => {
  const companyId = resolveCompanyId(req);
  const updated = await HrmLeaveApplicationModel.findOneAndUpdate(
    { _id: oneId, ...companyScope(companyId) },
    { isDeleted: true },
    { new: true },
  );
  if (!updated) throw new AppError(httpStatus.NOT_FOUND, "Leave application not found");
  return { _id: oneId };
};

const remove = withBulkDeleteAuthId(removeOne);

export const leaveService = {
  async list(req: AuthRequest, query: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    const ownership = resolveOwnership(
      req,
      permModule.manageAny("leave_applications"),
      permModule.manageOwn("leave_applications"),
    );
    const base = applyOwnershipToQuery(companyScope(companyId), ownership, { employeeField: true });
    let mq = HrmLeaveApplicationModel.find(base)
      .populate("employee_id", "name email image")
      .populate("leave_type_id", "name color is_paid");
    const qb = new queryBuilder(mq, query).search(["reason"]).filter().sort().fields();
    const { totalData } = await qb.paginate(HrmLeaveApplicationModel.find(base));
    const rows = await qb.modelQuery.lean().exec();
    const data = (rows as unknown as Record<string, unknown>[]).map(lean);
    const pagination = qb.calculatePagination({
      totalData,
      currentPage: Number(query?.page) || 1,
      limit: Number(query?.limit) || 10,
    });
    return { data, pagination };
  },

  async create(req: AuthRequest, body: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    const employee_id = body.employee_id ? String(body.employee_id) : resolveActorUserId(req);
    const leave_type_id = parseObjectId(body.leave_type_id, "leave_type_id", "Leave type");

    const start = parseDate(body.start_date, "start_date");
    const end = parseDate(body.end_date, "end_date");
    if (end < start) throw new AppError(httpStatus.BAD_REQUEST, "end_date must be on or after start_date");

    const total_days = diffDays(start, end);
    const leave_balance = await assertLeaveBalance(companyId, employee_id, leave_type_id, total_days);

    const doc = await HrmLeaveApplicationModel.create({
      employee_id: companyObjectId(employee_id),
      leave_type_id: companyObjectId(leave_type_id),
      start_date: start,
      end_date: end,
      total_days,
      reason: String(body.reason ?? ""),
      attachment: body.attachment,
      status: "pending",
      user_id: companyScope(companyId).user_id,
      creator_id: creatorObjectId(req),
      isDeleted: false,
    });

    return {
      ...lean(doc.toObject() as unknown as Record<string, unknown>),
      requested_days: total_days,
      leave_balance: {
        ...leave_balance,
        balance_after_request: leave_balance.balance - total_days,
      },
    };
  },

  async updateStatus(req: AuthRequest, id: string, body: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    const status = assertEnumValue(body.status, LEAVE_APPLICATION_STATUS, "status");

    const existing = await HrmLeaveApplicationModel.findOne({ _id: id, ...companyScope(companyId) }).lean();
    if (!existing) throw new AppError(httpStatus.NOT_FOUND, "Leave application not found");

    if (status === "approved" && existing.status !== "approved") {
      const days = existing.total_days ?? 0;
      if (!existing.leave_type_id) {
        throw new AppError(httpStatus.BAD_REQUEST, "Leave type is required to approve");
      }
      await assertLeaveBalance(
        companyId,
        String(existing.employee_id),
        String(existing.leave_type_id),
        days,
        id,
      );
    }

    const updated = await HrmLeaveApplicationModel.findOneAndUpdate(
      { _id: id, ...companyScope(companyId) },
      {
        $set: {
          status,
          approver_comment: body.approver_comment,
          approved_by: creatorObjectId(req),
          approved_at: new Date(),
        },
      },
      { new: true, runValidators: true },
    ).lean();
    if (!updated) throw new AppError(httpStatus.NOT_FOUND, "Leave application not found");
    return lean(updated as Record<string, unknown>);
  },

  async balance(req: AuthRequest, employeeUserId: string, leaveTypeId: string) {
    const companyId = resolveCompanyId(req);
    const snapshot = await getLeaveTypeBalance(companyId, employeeUserId, leaveTypeId);
    return snapshot;
  },

  async balanceReport(req: AuthRequest, query: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    const types = await HrmLeaveTypeModel.find(companyScope(companyId)).lean();
    if (!query.employee_id) {
      return {
        leave_types: types,
        note: "Pass employee_id for one employee, or GET /hrm/leave/balance/all-employees for everyone",
      };
    }
    const employeeUserId = await resolveEmployeeUserId(companyId, String(query.employee_id));
    const [usageMap] = await Promise.all([
      aggregateLeaveUsage(companyId, { employeeUserIds: [employeeUserId] }),
    ]);
    return {
      employee_id: employeeUserId,
      year: new Date().getFullYear(),
      balances: buildEmployeeLeaveBalances(employeeUserId, types, usageMap),
    };
  },

  async balanceAllEmployees(req: AuthRequest, query: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);

    const employeeFilter: Record<string, unknown> = {
      ...companyScope(companyId),
      isDeleted: false,
    };
    if (query.employee_id) {
      const filterId = await resolveEmployeeUserId(companyId, String(query.employee_id));
      employeeFilter.employee_user_id = companyObjectId(filterId);
    }

    let mq = HrmEmployeeModel.find(employeeFilter)
      .populate("employee_user_id", "name email image role")
      .select("employee_id employee_user_id");

    const qb = new queryBuilder(mq, query);
    await qb.searchNested(employeeListSearchNested(companyId));
    qb.filter().sort().fields();

    const [types, { totalData }] = await Promise.all([
      HrmLeaveTypeModel.find(companyScope(companyId)).lean(),
      qb.paginate(HrmEmployeeModel.find(employeeFilter)),
    ]);
    const employees = (await qb.modelQuery.lean().exec()) as unknown as Array<{
      _id: unknown;
      employee_id: string;
      employee_user_id: {
        _id?: unknown;
        name?: string;
        email?: string;
        image?: string;
        role?: string;
      } | unknown;
    }>;

    const pageUserIds = employees.map((emp) =>
      String((emp.employee_user_id as { _id?: unknown })?._id ?? emp.employee_user_id),
    );
    const usageMap = await aggregateLeaveUsage(companyId, {
      employeeUserIds: pageUserIds.length ? pageUserIds : undefined,
    });

    const data = employees.map((emp) => {
      const userRef = emp.employee_user_id as {
        _id?: unknown;
        name?: string;
        email?: string;
        image?: string;
        role?: string;
      } | null;
      const userId = String(userRef?._id ?? emp.employee_user_id);
      return {
        employee_profile_id: String(emp._id),
        employee_code: emp.employee_id,
        employee_user_id: userId,
        employee: userRef
          ? {
              ...formatUserRef(
                userRef as {
                  _id?: import("mongoose").Types.ObjectId;
                  name?: string;
                  email?: string;
                  image?: string;
                },
              ),
              role: userRef.role,
            }
          : null,
        balances: buildEmployeeLeaveBalances(userId, types, usageMap),
      };
    });

    const pagination = qb.calculatePagination({
      totalData,
      currentPage: Number(query?.page) || 1,
      limit: Number(query?.limit) || 10,
    });

    return { data, pagination, year: new Date().getFullYear() };
  },

  async leaveTypesForEmployee(req: AuthRequest, employeeUserId: string) {
    const companyId = resolveCompanyId(req);
    const resolvedEmployeeId = await resolveEmployeeUserId(companyId, employeeUserId);
    const [types, usageMap] = await Promise.all([
      HrmLeaveTypeModel.find(companyScope(companyId)).lean(),
      aggregateLeaveUsage(companyId, { employeeUserIds: [resolvedEmployeeId] }),
    ]);

    const leave_types = types.map((lt) => {
      const snap = snapshotFromType(lt, resolvedEmployeeId, usageMap);
      const max = lt.max_days_per_year ?? 0;
      return {
        _id: String(lt._id),
        name: lt.name,
        description: lt.description,
        color: lt.color,
        is_paid: lt.is_paid,
        max_days_per_year: max,
        used_days: snap.used_days,
        pending_days: snap.pending_days,
        balance: snap.balance,
        can_request: max > 0 && snap.balance > 0,
        ...(snap.note ? { note: snap.note } : {}),
      };
    });
    return { employee_id: resolvedEmployeeId, leave_types };
  },

  async update(req: AuthRequest, id: string, body: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    const existing = await HrmLeaveApplicationModel.findOne({ _id: id, ...companyScope(companyId) });
    if (!existing) throw new AppError(httpStatus.NOT_FOUND, "Leave application not found");

    const patch: Record<string, unknown> = {};
    if (body.leave_type_id) {
      patch.leave_type_id = companyObjectId(
        parseObjectId(body.leave_type_id, "leave_type_id", "Leave type"),
      );
    }
    if (body.reason !== undefined) patch.reason = body.reason;
    if (body.attachment !== undefined) patch.attachment = body.attachment;

    let total_days = existing.total_days ?? 0;
    if (body.start_date || body.end_date) {
      const start = body.start_date ? parseDate(body.start_date, "start_date") : existing.start_date!;
      const end = body.end_date ? parseDate(body.end_date, "end_date") : existing.end_date!;
      if (end < start) throw new AppError(httpStatus.BAD_REQUEST, "end_date must be on or after start_date");
      patch.start_date = start;
      patch.end_date = end;
      total_days = diffDays(start, end);
      patch.total_days = total_days;
    }

    const leaveTypeId = String(patch.leave_type_id ?? existing.leave_type_id ?? "");
    if (!leaveTypeId) throw new AppError(httpStatus.BAD_REQUEST, "leave_type_id is required");

    if (existing.status === "pending") {
      await assertLeaveBalance(companyId, String(existing.employee_id), leaveTypeId, total_days, id);
    }

    const updated = await HrmLeaveApplicationModel.findOneAndUpdate(
      { _id: id, ...companyScope(companyId) },
      { $set: patch },
      { new: true },
    ).lean();
    return lean(updated as Record<string, unknown>);
  },

  remove,
};
