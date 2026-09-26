import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import {
  HrmAttendanceModel,
  HrmEmployeeModel,
  HrmHolidayModel,
  HrmIpRestrictModel,
  HrmLeaveApplicationModel,
  HrmShiftModel,
} from "../models";
import {
  applyOwnershipToQuery,
  companyObjectId,
  companyScope,
  creatorObjectId,
  EMPLOYEE_USER_ROLES,
  formatDateOnly,
  parseDate,
  resolveActorUserId,
  resolveCompanyId,
  resolveOwnership,
  spansCalendarDay,
  startOfDay,
} from "../shared/hrm.utils";
import { UserModel } from "../../../basic_modules/user/user.model";
import { assertEnumValue, ATTENDANCE_STATUS } from "../shared/hrm.statusValidation";
import {
  assertCompanyDocument,
  assertCompanyEmployeeUser,
  parseObjectId,
  parseOptionalObjectId,
} from "../shared/hrm.refValidation";
import { AuthRequest } from "../../../../middlewares/auth";
import { permModule } from "../../../../utils/permissionModule";
import { getHrmCompanySettings } from "../shared/hrm.settings.service";
import { withBulkDeleteAuthId } from "../../../../utils/bulkDelete";

const formatAttendance = (row: Record<string, unknown>) => ({
  ...row,
  _id: row._id ? String(row._id) : undefined,
  date: formatDateOnly(row.date as Date),
});

const formatAttendanceDoc = (doc: { toObject?: () => Record<string, unknown> } | Record<string, unknown>) =>
  formatAttendance(
    typeof (doc as { toObject?: () => Record<string, unknown> }).toObject === "function"
      ? (doc as { toObject: () => Record<string, unknown> }).toObject()
      : (doc as Record<string, unknown>),
  );

/**
 * Clock times arrive from the app/web as "HH:MM" (the attendance modal), which
 * `new Date("HH:MM")` turns into Invalid Date. Combine the time with the record's
 * calendar `date` so it persists correctly. A full ISO string is accepted as-is.
 */
const combineDateTime = (date: Date, value: unknown): Date | undefined => {
  const s = String(value ?? "").trim();
  if (!s) return undefined;
  if (s.includes("T")) {
    const iso = new Date(s);
    if (!Number.isNaN(iso.getTime())) return iso;
  }
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (m) {
    const d = new Date(date);
    d.setHours(Number(m[1]), Number(m[2]), 0, 0);
    return d;
  }
  const fallback = new Date(s);
  return Number.isNaN(fallback.getTime()) ? undefined : fallback;
};

type AttendanceBlockCode = "COMPANY_HOLIDAY" | "ON_LEAVE" | "NON_WORKING_DAY";

type AttendanceDayEligibility = {
  allowed: boolean;
  code: AttendanceBlockCode | null;
  message: string;
};

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Checks holiday → approved leave → non-working day (weekend/off). */
const getAttendanceDayEligibility = async (
  companyId: string,
  employeeUserId: string,
  date: Date,
  dayIndex = date.getDay(),
): Promise<AttendanceDayEligibility> => {
  const scope = companyScope(companyId);
  const employeeOid = companyObjectId(employeeUserId);

  const holiday = await HrmHolidayModel.findOne({
    ...scope,
    ...spansCalendarDay(date),
  })
    .select("name")
    .lean();
  if (holiday) {
    return {
      allowed: false,
      code: "COMPANY_HOLIDAY",
      message: `Today is a company holiday (${holiday.name}). Clock-in is not allowed.`,
    };
  }

  const leave = await HrmLeaveApplicationModel.findOne({
    ...scope,
    employee_id: { $in: [employeeOid, employeeUserId] },
    status: "approved",
    ...spansCalendarDay(date),
  })
    .populate("leave_type_id", "name")
    .lean();
  if (leave) {
    const leaveType = leave.leave_type_id as { name?: string } | null;
    const typeLabel = leaveType?.name ? `${leaveType.name} leave` : "approved leave";
    return {
      allowed: false,
      code: "ON_LEAVE",
      message: `You are on ${typeLabel} today. Clock-in is not allowed.`,
    };
  }

  const settings = await getHrmCompanySettings(companyId);
  if (!settings.working_days.includes(dayIndex)) {
    return {
      allowed: false,
      code: "NON_WORKING_DAY",
      message: `Today (${WEEKDAY_NAMES[dayIndex]}) is not a working day for your company. Clock-in is not allowed.`,
    };
  }

  return {
    allowed: true,
    code: null,
    message: "You can clock in today.",
  };
};

const assertCanClockIn = async (
  companyId: string,
  employeeUserId: string,
  date: Date,
  dayIndex = date.getDay(),
) => {
  const eligibility = await getAttendanceDayEligibility(companyId, employeeUserId, date, dayIndex);
  if (!eligibility.allowed) {
    throw new AppError(httpStatus.BAD_REQUEST, eligibility.message);
  }
};

/** Statuses that mark the day without requiring a clock-in. */
const NON_CLOCK_STATUSES = new Set(["on leave", "off day", "absent"]);

const normalizeAttendanceStatus = (raw: unknown): string | undefined => {
  if (raw === undefined || raw === null || String(raw).trim() === "") return undefined;
  const s = String(raw).trim().toLowerCase();
  if (s === "leave" || s === "onleave") return "on leave";
  if (s === "half" || s === "halfday") return "half day";
  if (s === "off" || s === "dayoff" || s === "day off") return "off day";
  return s;
};

const resolveAttendanceStatus = (raw: unknown, fallback = "present") => {
  const normalized = normalizeAttendanceStatus(raw);
  if (normalized === undefined) return fallback;
  return assertEnumValue(normalized, ATTENDANCE_STATUS, "status");
};

const removeOne = async (req: AuthRequest, oneId: string) => {
  const companyId = resolveCompanyId(req);
  const updated = await HrmAttendanceModel.findOneAndUpdate(
    { _id: oneId, ...companyScope(companyId) },
    { isDeleted: true },
    { new: true }
  );
  if (!updated) throw new AppError(httpStatus.NOT_FOUND, "Attendance not found");
  return { _id: oneId };
};

const remove = withBulkDeleteAuthId(removeOne);

export const attendanceService = {
  async list(req: AuthRequest, query: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    const ownership = resolveOwnership(
      req,
      permModule.manageAny("attendances"),
      permModule.manageOwn("attendances"),
    );
    const base = applyOwnershipToQuery(companyScope(companyId), ownership, { employeeField: true });
    if (query.employee_id) (base as Record<string, unknown>).employee_id = query.employee_id;
    let mq = HrmAttendanceModel.find(base).select("_id employee_id shift_id date clock_in clock_out status notes").populate("employee_id", "name email").populate("shift_id", "shift_name");
    const qb = new queryBuilder(mq, query).filter().sort().fields();
    const { totalData } = await qb.paginate(HrmAttendanceModel.find(base));
    const rows = await qb.modelQuery.lean().exec();
    const pagination = qb.calculatePagination({
      totalData,
      currentPage: Number(query?.page) || 1,
      limit: Number(query?.limit) || 10,
    });
    return {
      data: (rows as Record<string, unknown>[]).map(formatAttendance),
      pagination,
    };
  },

  /**
   * Monthly attendance grid: the company's employees plus every attendance row
   * in the requested month, keyed `<employeeUserId>:<YYYY-MM-DD>` so the client
   * can render an employees × days matrix. Weekend/future/holiday derivation is
   * left to the client (dates are calendar dates).
   */
  async grid(req: AuthRequest, query: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    const now = new Date();
    const year = Number(query.year) || now.getFullYear();
    const month = Number(query.month) || now.getMonth() + 1; // 1-12
    const start = startOfDay(new Date(year, month - 1, 1));
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    // Grid rows = every employee-role user (staff / HR) of the company, not just
    // those with an HRM employee profile. Customers/vendors are excluded.
    const userFilter: Record<string, unknown> = {
      companyId: companyObjectId(companyId),
      role: { $in: EMPLOYEE_USER_ROLES },
      isDeleted: false,
    };
    if (query.employee_id) userFilter._id = companyObjectId(String(query.employee_id));
    const users = await UserModel.find(userFilter)
      .select("_id name email")
      .sort({ createdAt: 1 })
      .lean();

    // Attach each user's HRM employee code when a profile exists.
    const profiles = await HrmEmployeeModel.find({
      ...companyScope(companyId),
      employee_user_id: {
        $in: (users as Record<string, unknown>[]).map((u) => u._id),
      },
    })
      .select("_id employee_id employee_user_id")
      .lean();
    const profileByUser: Record<string, { id: string; code: string }> = {};
    for (const p of profiles as Record<string, unknown>[]) {
      profileByUser[String(p.employee_user_id)] = {
        id: String(p._id),
        code: (p.employee_id as string) ?? "",
      };
    }

    const records = await HrmAttendanceModel.find({
      ...companyScope(companyId),
      date: { $gte: start, $lte: end },
    })
      .select("_id employee_id date clock_in clock_out status notes total_hour")
      .lean();

    const hhmm = (v: unknown): string => {
      if (!v) return "";
      const d = new Date(String(v));
      if (Number.isNaN(d.getTime())) return "";
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    };

    const cells: Record<string, unknown> = {};
    for (const r of records as Record<string, unknown>[]) {
      const key = `${String(r.employee_id)}:${formatDateOnly(r.date as Date)}`;
      cells[key] = {
        _id: String(r._id),
        clock_in: hhmm(r.clock_in),
        clock_out: hhmm(r.clock_out),
        status: r.status ?? "present",
        notes: r.notes ?? "",
        total_hour: r.total_hour ?? 0,
      };
    }

    return {
      year,
      month,
      days_in_month: new Date(year, month, 0).getDate(),
      employees: (users as Record<string, unknown>[]).map((u) => {
        const uid = String(u._id);
        const profile = profileByUser[uid];
        return {
          _id: profile?.id ?? uid,
          employee_user_id: uid,
          name: (u.name as string) ?? "",
          email: (u.email as string) ?? "",
          employee_code: profile?.code ?? "",
        };
      }),
      cells,
    };
  },

  async createManual(req: AuthRequest, body: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    const employee_id = parseObjectId(body.employee_id, "employee_id", "Employee");
    await assertCompanyEmployeeUser(companyId, employee_id, "Employee");
    const shiftRaw = parseOptionalObjectId(body.shift_id, "shift_id", "Shift");
    if (shiftRaw) {
      await assertCompanyDocument(companyId, HrmShiftModel, shiftRaw, "Shift");
      body.shift_id = companyObjectId(shiftRaw);
    } else {
      // The grid flow doesn't pick a shift — default it from the employee's own
      // shift so reports still have one when available.
      const profile = await HrmEmployeeModel.findOne({
        ...companyScope(companyId),
        employee_user_id: employee_id,
      })
        .select("shift_id")
        .lean();
      if (profile?.shift_id) body.shift_id = profile.shift_id;
    }
    const date = startOfDay(parseDate(body.date, "date"));
    const status = resolveAttendanceStatus(body.status, "present");
    const skipClockGate = NON_CLOCK_STATUSES.has(status);
    const existing = await HrmAttendanceModel.findOne({
      ...companyScope(companyId),
      employee_id,
      date
    });
    if (existing) {
      // Full upsert: the attendance grid edits clock in/out (+ notes/status) of
      // whatever day cell is clicked, so an existing row must accept those too —
      // previously only status was updated here.
      const inAt = combineDateTime(date, body.clock_in);
      const outAt = combineDateTime(date, body.clock_out);
      // Marking leave / off day / absent does not require clock eligibility.
      // Present/half-day still cannot clock on holiday/approved-leave/weekend.
      if (!skipClockGate && (inAt || outAt)) {
        await assertCanClockIn(companyId, employee_id, date);
      }
      existing.status = status as never;
      if (skipClockGate) {
        existing.clock_in = null as never;
        existing.clock_out = null as never;
        existing.total_hour = 0;
      } else {
        if (inAt) existing.clock_in = inAt;
        if (outAt) existing.clock_out = outAt;
        if (existing.clock_in && existing.clock_out) {
          existing.total_hour =
            Math.round(((existing.clock_out.getTime() - existing.clock_in.getTime()) / 3600000) * 100) / 100;
        }
      }
      if (body.notes !== undefined) existing.notes = String(body.notes);
      await existing.save();
      return { action: "updated" as const, data: formatAttendanceDoc(existing) };
    }

    if (!skipClockGate) {
      await assertCanClockIn(companyId, employee_id, date);
    }
    const clockIn = skipClockGate ? undefined : (combineDateTime(date, body.clock_in) ?? new Date());
    const clockOut = skipClockGate ? undefined : combineDateTime(date, body.clock_out);
    const doc = await HrmAttendanceModel.create({
      employee_id,
      shift_id: body.shift_id,
      date,
      clock_in: clockIn,
      clock_out: clockOut,
      total_hour:
        clockIn && clockOut
          ? Math.round(((clockOut.getTime() - clockIn.getTime()) / 3600000) * 100) / 100
          : 0,
      status: status as never,
      notes: body.notes,
      user_id: companyScope(companyId).user_id,
      creator_id: creatorObjectId(req),
      isDeleted: false,
    });
    return { action: "created" as const, data: formatAttendanceDoc(doc) };
  },

  async clockStatus(req: AuthRequest) {
    const companyId = resolveCompanyId(req);
    const employeeId = resolveActorUserId(req);
    const now = new Date();
    const today = startOfDay(now);
    const [todayRow, pending, eligibility] = await Promise.all([
      HrmAttendanceModel.findOne({
        ...companyScope(companyId),
        employee_id: employeeId,
        date: today,
      }).lean(),
      HrmAttendanceModel.findOne({
        ...companyScope(companyId),
        employee_id: employeeId,
        clock_out: { $exists: false },
        clock_in: { $exists: true },
      })
        .sort({ clock_in: -1 })
        .lean(),
      getAttendanceDayEligibility(companyId, employeeId, today, now.getDay()),
    ]);
    const alreadyClockedIn = Boolean(todayRow?.clock_in);
    return {
      can_clock_in: !alreadyClockedIn && eligibility.allowed,
      can_clock_out: alreadyClockedIn,
      clock_in_blocked: !alreadyClockedIn && !eligibility.allowed,
      block_code: eligibility.code,
      block_message: eligibility.allowed ? null : eligibility.message,
      today_attendance: todayRow ? formatAttendance(todayRow as Record<string, unknown>) : null,
      pending_clock_out: pending
        ? formatAttendance(pending as Record<string, unknown>)
        : null,
    };
  },

  async clockIn(req: AuthRequest, ip?: string) {
    const companyId = resolveCompanyId(req);
    const employeeId = resolveActorUserId(req);
    const settings = await getHrmCompanySettings(companyId);
    if (settings.ip_restrict === "on" && ip) {
      const allowed = await HrmIpRestrictModel.exists({ ...companyScope(companyId), ip });
      if (!allowed) throw new AppError(httpStatus.FORBIDDEN, "This IP is not allowed to clock in & clock out");
    }
    const now = new Date();
    const today = startOfDay(now);
    await assertCanClockIn(companyId, employeeId, today, now.getDay());
    const profile = await HrmEmployeeModel.findOne({
      ...companyScope(companyId),
      employee_user_id: employeeId,
      isDeleted: false,
    }).lean();
    if (!profile?.shift_id) throw new AppError(httpStatus.BAD_REQUEST, "Employee shift is not configured");
    const open = await HrmAttendanceModel.findOne({
      ...companyScope(companyId),
      employee_id: employeeId,
      clock_out: { $exists: false },
      date: today,
    });
    if (open) throw new AppError(httpStatus.CONFLICT, "Please clock out from pending attendance first");
    const existing = await HrmAttendanceModel.findOne({
      ...companyScope(companyId),
      employee_id: employeeId,
      date: today,
    });
    if (existing?.clock_in) {
      throw new AppError(httpStatus.CONFLICT, "Already clocked in today");
    }
    if (existing) {
      existing.clock_in = now;
      await existing.save();
      return formatAttendanceDoc(existing);
    }
    const created = await HrmAttendanceModel.create({
      employee_id: employeeId,
      shift_id: profile.shift_id,
      date: today,
      clock_in: now,
      status: "present",
      user_id: companyScope(companyId).user_id,
      creator_id: creatorObjectId(req),
      isDeleted: false,
    });
    return formatAttendanceDoc(created);
  },

  async clockOut(req: AuthRequest) {
    const companyId = resolveCompanyId(req);
    const employeeId = resolveActorUserId(req);
    const today = startOfDay(new Date());
    const row = await HrmAttendanceModel.findOne({
      ...companyScope(companyId),
      employee_id: employeeId,
      date: today,
      clock_in: { $exists: true },
    });
    if (!row) throw new AppError(httpStatus.BAD_REQUEST, "Please clock in first");
    const now = new Date();
    row.clock_out = now;
    const hours = (now.getTime() - row.clock_in.getTime()) / (1000 * 60 * 60);
    row.total_hour = Math.round(hours * 100) / 100;
    row.status = hours < 4 ? "half day" : "present";
    await row.save();
    return formatAttendanceDoc(row);
  },

  /**
   * Once per day: first hit → clock in; every later hit same day → clock out (updates checkout time).
   */
  async clockInOut(req: AuthRequest, ip?: string) {
    const companyId = resolveCompanyId(req);
    const employeeId = resolveActorUserId(req);
    const today = startOfDay(new Date());
   
    const todayRow = await HrmAttendanceModel.findOne({
      ...companyScope(companyId),
      employee_id: employeeId,
      date: today,
    }).lean();
    if (!todayRow?.clock_in) {
      return { action: "clock_in" as const, data: await this.clockIn(req, ip) };
    }
    return { action: "clock_out" as const, data: await this.clockOut(req) };
  },

  async update(req: AuthRequest, id: string, body: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    const row = await HrmAttendanceModel.findOne({ _id: id, ...companyScope(companyId) });
    if (!row) throw new AppError(httpStatus.NOT_FOUND, "Attendance not found");
    if (body.employee_id) row.employee_id = String(body.employee_id) as never;
    if (body.shift_id) row.shift_id = body.shift_id as never;
    if (body.date) row.date = startOfDay(parseDate(body.date, "date"));
    const baseDate = row.date ?? new Date();
    if (body.clock_in) {
      const inAt = combineDateTime(baseDate, body.clock_in);
      if (inAt) row.clock_in = inAt;
    }
    if (body.clock_out) {
      const outAt = combineDateTime(baseDate, body.clock_out);
      if (outAt) row.clock_out = outAt;
    }
    if (body.status !== undefined) {
      row.status = resolveAttendanceStatus(body.status) as never;
      if (NON_CLOCK_STATUSES.has(String(row.status))) {
        row.clock_in = null as never;
        row.clock_out = null as never;
        row.total_hour = 0;
      }
    }
    if (body.notes !== undefined) row.notes = String(body.notes);
    if (row.clock_in && row.clock_out) {
      const hours = (row.clock_out.getTime() - row.clock_in.getTime()) / (1000 * 60 * 60);
      row.total_hour = Math.round(hours * 100) / 100;
    }
    await row.save();
    return formatAttendanceDoc(row);
  },

  remove,

  async history(req: AuthRequest, body: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    const employeeId = resolveActorUserId(req);
    const filter: Record<string, unknown> = {
      ...companyScope(companyId),
      employee_id: employeeId,
    };
    if (body.from_date) {
      (filter as { date?: object }).date = {
        ...(filter.date as object),
        $gte: startOfDay(parseDate(body.from_date, "from_date")),
      };
    }
    if (body.to_date) {
      (filter as { date?: object }).date = {
        ...(filter.date as object),
        $lte: startOfDay(parseDate(body.to_date, "to_date")),
      };
    }
    const rows = await HrmAttendanceModel.find(filter).sort({ date: -1 }).limit(100).lean();
    return (rows as Record<string, unknown>[]).map(formatAttendance);
  },
};
