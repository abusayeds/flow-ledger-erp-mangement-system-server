import {
  HrmAnnouncementModel,
  HrmAttendanceModel,
  HrmBranchModel,
  HrmDepartmentModel,
  HrmEmployeeModel,
  HrmEventModel,
  HrmHolidayModel,
  HrmLeaveApplicationModel,
  HrmPromotionModel,
  HrmTerminationModel,
} from "../models";
import {
  companyScope,
  isCompanyOrHr,
  isEmployeeRole,
  resolveActorUserId,
  resolveCompanyId,
  spansCalendarDay,
} from "../shared/hrm.utils";
import { AuthRequest } from "../../../../middlewares/auth";
import { attendanceService } from "../attendance/attendance.service";

const todayRange = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  return { today, end };
};

export const hrmDashboardService = {
  async home(req: AuthRequest) {
    const companyId = resolveCompanyId(req);
    const scope = companyScope(companyId);
    const { today, end } = todayRange();

    if (isEmployeeRole(req.user!) && !isCompanyOrHr(req.user!)) {
      const employeeId = resolveActorUserId(req);
      const clock = await attendanceService.clockStatus(req);
      const onLeave = await HrmLeaveApplicationModel.find({
        ...scope,
        employee_id: employeeId,
        status: "approved",
        ...spansCalendarDay(today),
      }).lean();
      const announcements = await HrmEventModel.find({ ...scope, status: "approved" }).limit(5).lean();
      return { view: "employee", clock, on_leave: onLeave, events: announcements };
    }

    const totalEmployees = await HrmEmployeeModel.countDocuments(scope);
    const presentToday = await HrmAttendanceModel.countDocuments({
      ...scope,
      date: { $gte: today, $lte: end },
      clock_in: { $exists: true },
    });
    const absentToday = await HrmAttendanceModel.countDocuments({
      ...scope,
      date: { $gte: today, $lte: end },
      status: "absent",
    });
    const onLeave = await HrmLeaveApplicationModel.countDocuments({
      ...scope,
      status: "approved",
      ...spansCalendarDay(today),
    });
    const pendingLeaves = await HrmLeaveApplicationModel.countDocuments({
      ...scope,
      status: "pending",
    });
    const totalBranches = await HrmBranchModel.countDocuments(scope);
    const totalDepartments = await HrmDepartmentModel.countDocuments(scope);
    const promotionsThisMonth = await HrmPromotionModel.countDocuments({
      ...scope,
      createdAt: {
        $gte: new Date(today.getFullYear(), today.getMonth(), 1),
      },
    });
    const terminationsThisMonth = await HrmTerminationModel.countDocuments({
      ...scope,
      status: "approved",
      createdAt: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) },
    });

    const events = await HrmEventModel.find({ ...scope, status: "approved" }).limit(20).lean();
    const holidays = await HrmHolidayModel.find({
      ...scope,
      end_date: { $gte: today },
    })
      .limit(20)
      .lean();

    // ── Content blocks ─────────────────────────────────────────────────────
    const PALETTE = ["3B82F6", "10B981", "F59E0B", "8B5CF6", "EF4444", "06B6D4", "EC4899", "14B8A6"];
    const avatarUrl = (name: string, i: number) =>
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "NA")}&background=${PALETTE[i % PALETTE.length]}&color=fff`;
    const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

    const employees = (await HrmEmployeeModel.find(scope)
      .populate("employee_user_id", "name email phone")
      .populate("department_id", "department_name")
      .populate("designation_id", "designation_name")
      .lean()) as any[];

    // Department distribution (employees per department).
    const deptCount = new Map<string, number>();
    for (const e of employees) {
      const nm = e.department_id?.department_name || "Unassigned";
      deptCount.set(nm, (deptCount.get(nm) || 0) + 1);
    }
    const departmentDistribution = [...deptCount.entries()].map(([name, count]) => ({ name, count }));

    // Employees currently on approved leave.
    const onLeaveApps = (await HrmLeaveApplicationModel.find({
      ...scope,
      status: "approved",
      ...spansCalendarDay(today),
    })
      .populate("employee_id", "name")
      .populate("leave_type_id", "name")
      .limit(10)
      .lean()) as any[];
    const employeesOnLeave = onLeaveApps.map((l, i) => {
      const name = l.employee_id?.name || "Employee";
      return { name, type: l.leave_type_id?.name || "Leave", days: l.total_days || 0, avatar: avatarUrl(name, i) };
    });

    // Recent leave applications.
    const recentApps = (await HrmLeaveApplicationModel.find(scope)
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("employee_id", "name")
      .populate("leave_type_id", "name")
      .lean()) as any[];
    const recentLeaveApplications = recentApps.map((l, i) => {
      const name = l.employee_id?.name || "Employee";
      return {
        name,
        type: l.leave_type_id?.name || "Leave",
        startDate: l.start_date ? new Date(l.start_date).toISOString().slice(0, 10) : "",
        endDate: l.end_date ? new Date(l.end_date).toISOString().slice(0, 10) : "",
        days: l.total_days || 0,
        status: cap(l.status || "pending"),
        avatar: avatarUrl(name, i),
      };
    });

    // Announcements.
    const anns = (await HrmAnnouncementModel.find(scope).sort({ createdAt: -1 }).limit(5).lean()) as any[];
    const announcements = anns.map((a) => ({
      title: a.title || "",
      description: a.description || "",
      date: a.start_date || a.createdAt || null,
    }));

    // Team members.
    const teamMembers = employees.slice(0, 6).map((e, i) => {
      const u = e.employee_user_id;
      const name = u?.name || e.employee_id || "Employee";
      return {
        name,
        role: e.designation_id?.designation_name || "—",
        department: e.department_id?.department_name || "—",
        attendance: 0,
        performance: 0,
        avatar: avatarUrl(name, i),
        email: u?.email || "",
        phone: u?.phone || "",
        location: "",
      };
    });

    // Upcoming birthdays (next 60 days).
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const nextBirthday = (dob: Date) => {
      const now = new Date();
      const next = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate())) next.setFullYear(now.getFullYear() + 1);
      return next;
    };
    const upcomingBirthdays = employees
      .filter((e) => e.date_of_birth)
      .map((e, i) => {
        const dob = new Date(e.date_of_birth);
        const nb = nextBirthday(dob);
        const u = e.employee_user_id;
        const name = u?.name || e.employee_id || "Employee";
        return {
          _nb: nb.getTime(),
          name,
          date: `${MONTHS[dob.getMonth()]} ${dob.getDate()}`,
          role: e.designation_id?.designation_name || "—",
          avatar: avatarUrl(name, i),
        };
      })
      .sort((a, b) => a._nb - b._nb)
      .slice(0, 5)
      .map(({ _nb, ...rest }) => rest);

    return {
      view: "company",
      stats: {
        total_employees: totalEmployees,
        present_today: presentToday,
        absent_today: absentToday,
        on_leave: onLeave,
        pending_leaves: pendingLeaves,
        total_branches: totalBranches,
        total_departments: totalDepartments,
        promotions_this_month: promotionsThisMonth,
        terminations_this_month: terminationsThisMonth,
      },
      calendar: { events, holidays },
      departmentDistribution,
      employeesOnLeave,
      recentLeaveApplications,
      announcements,
      teamMembers,
      upcomingBirthdays,
    };
  },

  async events(req: AuthRequest, body: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    const scope = companyScope(companyId);
    const filter: Record<string, unknown> = { ...scope };
    if (body.from_date || body.to_date) {
      filter.start_date = {};
      if (body.from_date) (filter.start_date as { $gte?: Date }).$gte = new Date(String(body.from_date));
      if (body.to_date) (filter.start_date as { $lte?: Date }).$lte = new Date(String(body.to_date));
    }
    return HrmEventModel.find(filter).populate("event_type_id").lean();
  },
};
