/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuthRequest } from "../../../../middlewares/auth";
import {
  HrmEmployeeModel,
  HrmAttendanceModel,
  HrmLeaveApplicationModel,
  HrmBranchModel,
  HrmDepartmentModel,
  HrmPromotionModel,
  HrmTerminationModel,
  HrmAnnouncementModel,
  HrmAwardModel,
  HrmWarningModel,
  HrmComplaintModel,
  HrmEventModel,
  HrmHolidayModel,
  HrmShiftModel,
} from "../../hrm/models";
import {
  actorRole,
  companyObjectId,
  companyScope,
  endOfDay,
  formatDateOnly,
  monthRange,
  resolveActorUserId,
  resolveCompanyId,
  ROLE,
  startOfDay,
} from "../dashboard.utils";

const dayMatch = (d: Date) => ({ $gte: startOfDay(d), $lte: endOfDay(d) });
const yearRange = (year: number) => ({
  $gte: new Date(year, 0, 1, 0, 0, 0, 0),
  $lte: new Date(year, 11, 31, 23, 59, 59, 999),
});

/** Approved events + holidays shaped for the calendar widget. */
const buildCalendar = async (companyId: string) => {
  const scope = companyScope(companyId);
  const [events, holidays] = await Promise.all([
    HrmEventModel.find({ ...scope, status: "approved" }).populate("event_type_id", "event_type").lean(),
    HrmHolidayModel.find(scope).lean(),
  ]);
  const eventItems = events.map((e: any) => ({
    id: e._id,
    title: e.title,
    startDate: formatDateOnly(e.start_date),
    endDate: formatDateOnly(e.end_date),
    time: e.start_time || "",
    description: e.description || "",
    type: e.event_type_id?.event_type || "event",
    color: e.color || "#3b82f6",
  }));
  const holidayItems = holidays.map((h: any) => ({
    id: h._id,
    title: h.name,
    startDate: formatDateOnly(h.start_date),
    endDate: formatDateOnly(h.end_date),
    time: "",
    description: h.description || "",
    type: "holiday",
    color: "#ef4444",
  }));
  return [...eventItems, ...holidayItems];
};

const activeAnnouncements = async (companyId: string, today: Date) => {
  const scope = companyScope(companyId);
  const rows = await HrmAnnouncementModel.find({
    ...scope,
    status: "active",
    start_date: { $lte: endOfDay(today) },
    end_date: { $gte: startOfDay(today) },
  })
    .sort({ createdAt: -1 })
    .lean();
  return rows.map((a: any) => ({
    id: a._id,
    title: a.title,
    description: a.description || "",
    created_at: a.createdAt,
  }));
};

/** Employees whose birthday falls within the next 30 days, soonest first. */
const upcomingBirthdays = async (companyId: string, today: Date) => {
  const scope = companyScope(companyId);
  const rows = await HrmEmployeeModel.find({
    ...scope,
    date_of_birth: { $ne: null },
  })
    .populate("employee_user_id", "name email")
    .lean();
  const start = startOfDay(today);
  const items = rows
    .map((e: any) => {
      const dob = e.date_of_birth ? new Date(e.date_of_birth) : null;
      if (!dob || isNaN(dob.getTime())) return null;
      let next = new Date(start.getFullYear(), dob.getMonth(), dob.getDate());
      if (next < start) next = new Date(start.getFullYear() + 1, dob.getMonth(), dob.getDate());
      const days_until = Math.round((next.getTime() - start.getTime()) / 86400000);
      return {
        id: e._id,
        employee_name: (e.employee_user_id as any)?.name || "",
        date_of_birth: formatDateOnly(dob),
        next_birthday: formatDateOnly(next),
        days_until,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null && x.days_until <= 30)
    .sort((a, b) => a.days_until - b.days_until)
    .slice(0, 10);
  return items;
};

/* ------------------------- COMPANY / HR ---------------------------- */
const companyDashboard = async (companyId: string) => {
  const scope = companyScope(companyId);
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const thisMonth = monthRange(today.getFullYear(), today.getMonth());

  const [
    totalEmployees,
    presentTodayIds,
    absentTodayIds,
    onLeave,
    absentYesterdayIds,
    pendingLeaves,
    totalBranches,
    totalDepartments,
    totalPromotions,
    terminations,
  ] = await Promise.all([
    HrmEmployeeModel.countDocuments(scope),
    HrmAttendanceModel.distinct("employee_id", {
      ...scope,
      date: dayMatch(today),
      clock_in: { $ne: null },
    }),
    HrmAttendanceModel.distinct("employee_id", { ...scope, date: dayMatch(today), status: "absent" }),
    HrmLeaveApplicationModel.countDocuments({
      ...scope,
      status: "approved",
      start_date: { $lte: endOfDay(today) },
      end_date: { $gte: startOfDay(today) },
    }),
    HrmAttendanceModel.distinct("employee_id", { ...scope, date: dayMatch(yesterday), status: "absent" }),
    HrmLeaveApplicationModel.countDocuments({ ...scope, status: "pending", start_date: thisMonth }),
    HrmBranchModel.countDocuments(scope),
    HrmDepartmentModel.countDocuments(scope),
    HrmPromotionModel.countDocuments({ ...scope, effective_date: thisMonth }),
    HrmTerminationModel.countDocuments({ ...scope, status: "approved", termination_date: thisMonth }),
  ]);

  // Department distribution (employee count per department).
  const departments = await HrmDepartmentModel.find(scope).populate("branch_id", "branch_name").lean();
  const departmentDistribution = await Promise.all(
    departments.map(async (dept: any) => ({
      name: `${dept.department_name} (${dept.branch_id?.branch_name || "Unknown"})`,
      value: await HrmEmployeeModel.countDocuments({ ...scope, department_id: dept._id }),
    }))
  );

  // Employees without attendance today.
  const attendedIds = (
    await HrmAttendanceModel.distinct("employee_id", { ...scope, date: dayMatch(today) })
  ).map((id) => String(id));
  const absentEmployees = await HrmEmployeeModel.find({
    ...scope,
    employee_user_id: { $nin: attendedIds },
  })
    .populate("employee_user_id", "name image")
    .populate("department_id", "department_name")
    .lean();
  const employeesWithoutAttendance = absentEmployees.map((e: any) => ({
    employee_id: e.employee_id || "Unknown",
    profile: e.employee_user_id?.image || "",
    name: e.employee_user_id?.name || "Unknown",
    department: e.department_id?.department_name || "Unknown",
  }));

  // Employees on leave today.
  const leavesToday = await HrmLeaveApplicationModel.find({
    ...scope,
    status: "approved",
    start_date: { $lte: endOfDay(today) },
    end_date: { $gte: startOfDay(today) },
  })
    .populate("employee_id", "name image")
    .populate("leave_type_id", "name")
    .lean();
  const employeesOnLeaveToday = leavesToday.map((l: any) => ({
    name: l.employee_id?.name || "Unknown",
    profile: l.employee_id?.image || "",
    leave_type: l.leave_type_id?.name || "Unknown",
    days: l.total_days,
  }));

  const calendarEvents = await buildCalendar(companyId);

  const recentLeaveApplications = (
    await HrmLeaveApplicationModel.find(scope)
      .populate("employee_id", "name")
      .populate("leave_type_id", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
  ).map((l: any) => ({
    id: l._id,
    employee_name: l.employee_id?.name || "Unknown",
    leave_type: l.leave_type_id?.name || "Unknown",
    start_date: l.start_date,
    end_date: l.end_date,
    total_days: l.total_days,
    status: l.status,
    created_at: l.createdAt,
  }));

  const recentAnnouncements = await activeAnnouncements(companyId, today);

  // Compact team snapshot for the dashboard (no invented attendance %).
  const teamRaw = await HrmEmployeeModel.find(scope)
    .populate("employee_user_id", "name image")
    .populate("designation_id", "designation_name")
    .populate("department_id", "department_name")
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();
  const teamMembers = teamRaw.map((e: any) => ({
    name: e.employee_user_id?.name || e.employee_id || "Employee",
    role: e.designation_id?.designation_name || "—",
    department: e.department_id?.department_name || "—",
    avatar: e.employee_user_id?.image || "",
  }));

  return {
    stats: {
      total_employees: totalEmployees,
      present_today: presentTodayIds.length,
      absent_today: absentTodayIds.length,
      absent_yesterday: absentYesterdayIds.length,
      on_leave: onLeave,
      pending_leaves: pendingLeaves,
      total_branches: totalBranches,
      total_departments: totalDepartments,
      total_promotions: totalPromotions,
      terminations,
      department_distribution: departmentDistribution,
      calendar_events: calendarEvents,
      recent_leave_applications: recentLeaveApplications,
      recent_announcements: recentAnnouncements,
      upcoming_birthdays: await upcomingBirthdays(companyId, today),
      employees_on_leave_today: employeesOnLeaveToday,
      employees_without_attendance: employeesWithoutAttendance,
      team_members: teamMembers,
    },
    message: "HRM Dashboard - Complete overview of your workforce.",
  };
};

/* --------------------------- EMPLOYEE ------------------------------ */
const employeeDashboard = async (companyId: string, userId: string) => {
  const scope = companyScope(companyId);
  const uid = companyObjectId(userId);
  const today = new Date();
  const thisMonth = monthRange(today.getFullYear(), today.getMonth());
  const thisYear = yearRange(today.getFullYear());

  const empScope = { ...scope, employee_id: uid };

  const [
    myAttendance,
    pendingRequests,
    totalAbsentDays,
    totalAwards,
    totalWarnings,
    totalComplaints,
  ] = await Promise.all([
    HrmAttendanceModel.countDocuments({ ...empScope, date: thisMonth, clock_in: { $ne: null } }),
    HrmLeaveApplicationModel.countDocuments({ ...empScope, status: "pending", start_date: thisMonth }),
    HrmAttendanceModel.countDocuments({ ...empScope, status: "absent", date: thisMonth }),
    HrmAwardModel.countDocuments({ ...empScope, award_date: thisMonth }),
    HrmWarningModel.countDocuments({ ...empScope, warning_date: thisYear }),
    HrmComplaintModel.countDocuments({ ...empScope, complaint_date: thisYear }),
  ]);

  const sumDays = async (match: Record<string, any>) => {
    const r = await HrmLeaveApplicationModel.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: "$total_days" } } },
    ]);
    return r[0]?.total || 0;
  };
  const totalApprovedLeaveYear = await sumDays({ ...empScope, status: "approved", start_date: thisYear });
  const totalApprovedLeaveMonth = await sumDays({ ...empScope, status: "approved", start_date: thisMonth });

  const calendarEvents = await buildCalendar(companyId);
  const recentAnnouncements = await activeAnnouncements(companyId, today);

  const recentLeaveApplications = (
    await HrmLeaveApplicationModel.find(empScope)
      .populate("leave_type_id", "name")
      .sort({ createdAt: -1 })
      .lean()
  ).map((l: any) => ({
    id: l._id,
    leave_type: l.leave_type_id?.name || "Unknown",
    start_date: l.start_date,
    end_date: l.end_date,
    total_days: l.total_days,
    status: l.status,
    created_at: l.createdAt,
  }));

  const recentAwards = (
    await HrmAwardModel.find(empScope).populate("award_type_id", "name").sort({ createdAt: -1 }).lean()
  ).map((a: any) => ({
    id: a._id,
    award_type: a.award_type_id?.name || "Award",
    award_date: a.award_date,
    created_at: a.createdAt,
  }));

  const recentWarnings = (
    await HrmWarningModel.find(empScope)
      .populate("warning_type_id", "warning_type_name")
      .sort({ createdAt: -1 })
      .lean()
  ).map((w: any) => ({
    id: w._id,
    warning_type: w.warning_type_id?.warning_type_name || "Warning",
    warning_date: w.warning_date,
    created_at: w.createdAt,
  }));

  // Attendance widget (simplified: clock state from today's record, no shift-window math).
  const employee = await HrmEmployeeModel.findOne({ ...scope, employee_user_id: uid }).lean();
  const shift =
    employee && (employee as any).shift_id
      ? await HrmShiftModel.findOne({ ...scope, _id: (employee as any).shift_id }).lean()
      : null;
  const todayAttendance = await HrmAttendanceModel.findOne({ ...empScope, date: dayMatch(today) }).lean();
  const isOnLeave = await HrmLeaveApplicationModel.exists({
    ...empScope,
    status: "approved",
    start_date: { $lte: endOfDay(today) },
    end_date: { $gte: startOfDay(today) },
  });
  const isHoliday = await HrmHolidayModel.exists({
    ...scope,
    start_date: { $lte: endOfDay(today) },
    end_date: { $gte: startOfDay(today) },
  });
  const ta: any = todayAttendance;
  const attendanceData = {
    is_clocked_in: !!(ta?.clock_in && !ta?.clock_out),
    clock_in_time: ta?.clock_in || null,
    clock_out_time: ta?.clock_out || null,
    total_working_hours: ta?.total_hour ? `${ta.total_hour} hours` : null,
    can_clock: !isOnLeave && !isHoliday,
    shift_start_time: shift ? (shift as any).start_time : null,
    shift_end_time: shift ? (shift as any).end_time : null,
    is_on_leave: !!isOnLeave,
    is_holiday: !!isHoliday,
  };

  const recentAttendance = (
    await HrmAttendanceModel.find(empScope).sort({ date: -1 }).limit(5).lean()
  ).map((a: any) => ({
    date: a.date,
    clock_in: a.clock_in,
    clock_out: a.clock_out,
    status: a.status,
    total_hour: a.total_hour,
  }));

  return {
    stats: {
      my_attendance: myAttendance,
      total_approved_leave_year: totalApprovedLeaveYear,
      total_approved_leave_month: totalApprovedLeaveMonth,
      pending_requests: pendingRequests,
      total_absent_days: totalAbsentDays,
      total_awards: totalAwards,
      total_warnings: totalWarnings,
      total_complaints: totalComplaints,
      calendar_events: calendarEvents,
      recent_announcements: recentAnnouncements,
      recent_leave_applications: recentLeaveApplications,
      upcoming_birthdays: await upcomingBirthdays(companyId, today),
      recent_awards: recentAwards,
      recent_warnings: recentWarnings,
      attendance_data: attendanceData,
      recent_attendance: recentAttendance,
    },
    message: "Employee Dashboard - Your personal workspace.",
  };
};

const getDashboard = async (req: AuthRequest) => {
  const companyId = resolveCompanyId(req);
  const type = actorRole(req);

  if (type === ROLE.company || type === ROLE.hr || type === ROLE.superadmin) {
    return companyDashboard(companyId);
  }
  return employeeDashboard(companyId, resolveActorUserId(req));
};

export const hrmDashboardService = { getDashboard };
