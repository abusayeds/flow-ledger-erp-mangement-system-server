import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import {
  HrmAllowanceModel,
  HrmAttendanceModel,
  HrmDeductionModel,
  HrmEmployeeModel,
  HrmLeaveApplicationModel,
  HrmLoanModel,
  HrmOvertimeModel,
  HrmPayrollEntryModel,
  HrmPayrollModel,
} from "../models";
import { employeeListSearchNested } from "../shared/hrm.employeeSearch";
import {
  companyScope,
  creatorObjectId,
  parseDate,
  resolveCompanyId,
  roundMoney,
} from "../shared/hrm.utils";
import { AuthRequest } from "../../../../middlewares/auth";
import { getHrmCompanySettings } from "../shared/hrm.settings.service";
import { assertEnumValue, PAYROLL_STATUS } from "../shared/hrm.statusValidation";
import { withBulkDeleteAuthId } from "../../../../utils/bulkDelete";

const calcComponent = (items: { type: string; amount: number }[], base: number) => {
  let total = 0;
  const breakdown: { type: string; amount: number; value: number }[] = [];
  for (const item of items) {
    const value = item.type === "percentage" ? (base * item.amount) / 100 : item.amount;
    total += value;
    breakdown.push({ type: item.type, amount: item.amount, value: roundMoney(value) });
  }
  return { total: roundMoney(total), breakdown };
};

const countWorkingDays = (start: Date, end: Date, workingDays: number[]) => {
  let count = 0;
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endD = new Date(end);
  endD.setHours(23, 59, 59, 999);
  while (cur <= endD) {
    if (workingDays.includes(cur.getDay())) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

const removeOne = async (req: AuthRequest, oneId: string) => {
  const companyId = resolveCompanyId(req);
  const payroll = await HrmPayrollModel.findOne({ _id: oneId, ...companyScope(companyId) });
  if (!payroll) throw new AppError(httpStatus.NOT_FOUND, "Payroll not found");
  await HrmPayrollEntryModel.updateMany({ payroll_id: oneId, ...companyScope(companyId) }, { isDeleted: true });
  payroll.isDeleted = true;
  await payroll.save();
  return { _id: oneId };
};

const remove = withBulkDeleteAuthId(removeOne);

const deleteEntryOne = async (req: AuthRequest, entryId: string) => {
  const companyId = resolveCompanyId(req);
  const entry = await HrmPayrollEntryModel.findOne({ _id: entryId, ...companyScope(companyId) });
  if (!entry) throw new AppError(httpStatus.NOT_FOUND, "Payslip not found");
  const payrollId = entry.payroll_id;
  entry.isDeleted = true;
  await entry.save();
  const entries = await HrmPayrollEntryModel.find({ payroll_id: payrollId, isDeleted: false });
  const payroll = await HrmPayrollModel.findOne({ _id: payrollId, ...companyScope(companyId) });
  if (payroll) {
    payroll.total_gross_pay = roundMoney(entries.reduce((s, e) => s + e.gross_pay, 0));
    payroll.total_deductions = roundMoney(entries.reduce((s, e) => s + e.total_deductions + e.total_loans, 0));
    payroll.total_net_pay = roundMoney(entries.reduce((s, e) => s + e.net_pay, 0));
    payroll.employee_count = entries.length;
    await payroll.save();
  }
  return { _id: entryId };
};

const deleteEntry = withBulkDeleteAuthId(deleteEntryOne);

export const payrollService = {
  async list(req: AuthRequest, query: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    const base = companyScope(companyId);
    const qb = new queryBuilder(HrmPayrollModel.find(base), query).search(["title"]).filter().sort().fields();
    const { totalData } = await qb.paginate(HrmPayrollModel.find(base));
    const data = await qb.modelQuery.exec();
    const pagination = qb.calculatePagination({
      totalData,
      currentPage: Number(query?.page) || 1,
      limit: Number(query?.limit) || 10,
    });
    return { data, pagination };
  },

  async create(req: AuthRequest, body: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    const doc = await HrmPayrollModel.create({
      title: body.title,
      payroll_frequency: body.payroll_frequency ?? "monthly",
      pay_period_start: parseDate(body.pay_period_start, "pay_period_start"),
      pay_period_end: parseDate(body.pay_period_end, "pay_period_end"),
      pay_date: body.pay_date ? parseDate(body.pay_date) : undefined,
      notes: body.notes,
      bank_account_id: body.bank_account_id,
      user_id: companyScope(companyId).user_id,
      creator_id: creatorObjectId(req),
      isDeleted: false,
    });
    return doc;
  },

  async get(req: AuthRequest, id: string) {
    const companyId = resolveCompanyId(req);
    const payroll = await HrmPayrollModel.findOne({ _id: id, ...companyScope(companyId) }).lean();
    if (!payroll) throw new AppError(httpStatus.NOT_FOUND, "Payroll not found");
    const entries = await HrmPayrollEntryModel.find({ payroll_id: id, ...companyScope(companyId) })
      .populate("employee_id", "name email")
      .lean();
    return { payroll, entries };
  },

  async run(req: AuthRequest, id: string) {
    const companyId = resolveCompanyId(req);
    const payroll = await HrmPayrollModel.findOne({ _id: id, ...companyScope(companyId) });
    if (!payroll) throw new AppError(httpStatus.NOT_FOUND, "Payroll not found");
    const settings = await getHrmCompanySettings(companyId);
    if (!settings.working_days.length) {
      throw new AppError(httpStatus.BAD_REQUEST, "Please configure working days first");
    }
    const start = payroll.pay_period_start!;
    const end = payroll.pay_period_end!;
    const workingDaysCount = countWorkingDays(start, end, settings.working_days);
    payroll.status = "processing";
    await payroll.save();

    const employees = await HrmEmployeeModel.find({ ...companyScope(companyId), isDeleted: false }).lean();
    let newCount = 0;
    for (const emp of employees) {
      const exists = await HrmPayrollEntryModel.exists({
        payroll_id: payroll._id,
        employee_id: emp.employee_user_id,
      });
      if (exists) continue;
      const userId = emp.employee_user_id;
      const basicSalary = emp.basic_salary ?? 0;
      const perDay = workingDaysCount > 0 ? basicSalary / workingDaysCount : 0;
      const allowances = await HrmAllowanceModel.find({ ...companyScope(companyId), employee_id: userId }).lean();
      const deductions = await HrmDeductionModel.find({ ...companyScope(companyId), employee_id: userId }).lean();
      const loans = await HrmLoanModel.find({
        ...companyScope(companyId),
        employee_id: userId,
        start_date: { $lte: end },
        end_date: { $gte: start },
      }).lean();
      const overtimes = await HrmOvertimeModel.find({
        ...companyScope(companyId),
        employee_id: userId,
        status: "active",
        start_date: { $lte: end },
        end_date: { $gte: start },
      }).lean();

      const allowanceData = calcComponent(allowances.map((a) => ({ type: a.type, amount: a.amount })), basicSalary);
      const deductionData = calcComponent(deductions.map((d) => ({ type: d.type, amount: d.amount })), basicSalary);
      const loanData = calcComponent(loans.map((l) => ({ type: l.type, amount: l.amount })), basicSalary);
      let manualOtTotal = 0;
      let manualOtHours = 0;
      const otBreakdown = overtimes.map((o) => {
        const amt = roundMoney(o.hours * o.rate);
        manualOtTotal += amt;
        manualOtHours += o.hours;
        return { title: o.title, hours: o.hours, rate: o.rate, amount: amt };
      });

      const attendances = await HrmAttendanceModel.find({
        ...companyScope(companyId),
        employee_id: userId,
        date: { $gte: start, $lte: end },
      }).lean();
      let present = 0;
      let half = 0;
      let absent = 0;
      let otHours = 0;
      let otAmount = 0;
      for (const a of attendances) {
        if (a.status === "present") present++;
        else if (a.status === "half day") half++;
        else if (a.status === "absent") absent++;
        otHours += a.overtime_hours ?? 0;
        otAmount += a.overtime_amount ?? 0;
      }

      const leaves = await HrmLeaveApplicationModel.find({
        ...companyScope(companyId),
        employee_id: userId,
        status: "approved",
        start_date: { $lte: end },
        end_date: { $gte: start },
      })
        .populate("leave_type_id")
        .lean();
      let paidLeave = 0;
      let unpaidLeave = 0;
      for (const lv of leaves) {
        const lt = lv.leave_type_id as { is_paid?: boolean } | null;
        const days = lv.total_days ?? 0;
        if (lt?.is_paid) paidLeave += days;
        else unpaidLeave += days;
      }

      const halfDed = perDay * half * 0.5;
      const absentDed = perDay * absent;
      const unpaidDed = perDay * unpaidLeave;
      const gross =
        basicSalary +
        allowanceData.total +
        manualOtTotal -
        halfDed -
        absentDed -
        unpaidDed +
        otAmount;
      const net = gross - deductionData.total - loanData.total;

      await HrmPayrollEntryModel.create({
        payroll_id: payroll._id,
        employee_id: userId,
        basic_salary: basicSalary,
        total_allowances: allowanceData.total,
        total_deductions: deductionData.total,
        total_loans: loanData.total,
        gross_pay: roundMoney(gross),
        net_pay: roundMoney(net),
        per_day_salary: roundMoney(perDay),
        working_days: workingDaysCount,
        present_days: present,
        half_days: half,
        half_day_deduction: roundMoney(halfDed),
        absent_days: absent,
        absent_day_deduction: roundMoney(absentDed),
        paid_leave_days: paidLeave,
        unpaid_leave_days: unpaidLeave,
        unpaid_leave_deduction: roundMoney(unpaidDed),
        manual_overtime_hours: manualOtHours,
        total_manual_overtimes: manualOtTotal,
        attendance_overtime_hours: otHours,
        attendance_overtime_rate: emp.rate_per_hour ?? 0,
        attendance_overtime_amount: otAmount,
        overtime_hours: manualOtHours + otHours,
        status: "unpaid",
        allowances_breakdown: allowanceData.breakdown,
        deductions_breakdown: deductionData.breakdown,
        manual_overtimes_breakdown: otBreakdown,
        loans_breakdown: loanData.breakdown,
        user_id: companyScope(companyId).user_id,
        creator_id: creatorObjectId(req),
        isDeleted: false,
      });
      newCount++;
    }

    const entries = await HrmPayrollEntryModel.find({ payroll_id: payroll._id });
    payroll.status = "completed";
    payroll.total_gross_pay = roundMoney(entries.reduce((s, e) => s + e.gross_pay, 0));
    payroll.total_deductions = roundMoney(entries.reduce((s, e) => s + e.total_deductions + e.total_loans, 0));
    payroll.total_net_pay = roundMoney(entries.reduce((s, e) => s + e.net_pay, 0));
    payroll.employee_count = entries.length;
    await payroll.save();
    return { payroll, new_entries: newCount, total_entries: entries.length };
  },

  async payEntry(req: AuthRequest, entryId: string) {
    const companyId = resolveCompanyId(req);
    const entry = await HrmPayrollEntryModel.findOneAndUpdate(
      { _id: entryId, ...companyScope(companyId) },
      { status: "paid" },
      { new: true }
    );
    if (!entry) throw new AppError(httpStatus.NOT_FOUND, "Payslip not found");
    return entry;
  },

  async update(req: AuthRequest, id: string, body: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    const patch: Record<string, unknown> = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.payroll_frequency !== undefined) patch.payroll_frequency = body.payroll_frequency;
    if (body.pay_period_start) patch.pay_period_start = parseDate(body.pay_period_start, "pay_period_start");
    if (body.pay_period_end) patch.pay_period_end = parseDate(body.pay_period_end, "pay_period_end");
    if (body.pay_date) patch.pay_date = parseDate(body.pay_date);
    if (body.notes !== undefined) patch.notes = body.notes;
    if (body.status !== undefined) {
      patch.status = assertEnumValue(body.status, PAYROLL_STATUS, "status");
    }
    const updated = await HrmPayrollModel.findOneAndUpdate(
      { _id: id, ...companyScope(companyId) },
      { $set: patch },
      { new: true, runValidators: true },
    ).lean();
    if (!updated) throw new AppError(httpStatus.NOT_FOUND, "Payroll not found");
    return updated;
  },

  remove,

  deleteEntry,

  async printPayslip(req: AuthRequest, entryId: string) {
    const companyId = resolveCompanyId(req);
    const entry = await HrmPayrollEntryModel.findOne({ _id: entryId, ...companyScope(companyId) })
      .populate("employee_id", "name email image phone")
      .populate({ path: "payroll_id", select: "title pay_period_start pay_period_end pay_date" })
      .lean();
    if (!entry) throw new AppError(httpStatus.NOT_FOUND, "Payslip not found");
    const profile = await HrmEmployeeModel.findOne({
      ...companyScope(companyId),
      employee_user_id: entry.employee_id,
      isDeleted: false,
    })
      .populate("designation_id", "designation_name")
      .populate("department_id", "department_name")
      .lean();
    return { entry, employee_profile: profile };
  },
};

export const setSalaryService = {
  async listEmployees(req: AuthRequest, query: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    const base = companyScope(companyId);
    if (query.branch_id) (base as Record<string, unknown>).branch_id = query.branch_id;
    if (query.department_id) (base as Record<string, unknown>).department_id = query.department_id;
    if (query.designation_id) (base as Record<string, unknown>).designation_id = query.designation_id;

    const mq = HrmEmployeeModel.find(base)
      .populate("employee_user_id", "name email image phone")
      .populate("branch_id", "branch_name")
      .populate("department_id", "department_name")
      .populate("designation_id", "designation_name");

    const qb = new queryBuilder(mq, query);
    await qb.searchNested(
      employeeListSearchNested(companyId, [
        "employee_id",
        "account_holder_name",
        "address_line_1",
        "city",
        "emergency_contact_name",
      ])
    );
    qb.filter().sort().fields();
    const { totalData } = await qb.paginate(HrmEmployeeModel.find(base));
    const rows = await qb.modelQuery.lean().exec();
    const data = (rows as unknown as Record<string, unknown>[]).map((doc) => ({
      ...doc,
      _id: doc._id ? String(doc._id) : undefined,
    }));
    const pagination = qb.calculatePagination({
      totalData,
      currentPage: Number(query?.page) || 1,
      limit: Number(query?.limit) || 10,
    });
    return { data, pagination };
  },

  async getEmployeeSalary(req: AuthRequest, employeeProfileId: string) {
    const companyId = resolveCompanyId(req);
    const emp = await HrmEmployeeModel.findOne({ _id: employeeProfileId, ...companyScope(companyId) })
      .select("employee_id basic_salary employee_user_id branch_id department_id designation_id")
      .populate("employee_user_id", "name email image phone")
      .populate("branch_id", "branch_name")
      .populate("department_id", "department_name")
      .populate("designation_id", "designation_name").lean();
    if (!emp) throw new AppError(httpStatus.NOT_FOUND, "Employee not found");
    const userId = emp.employee_user_id;
    const [allowances, deductions, loans, overtimes] = await Promise.all([
      HrmAllowanceModel.find({ ...companyScope(companyId), employee_id: userId }).populate({ path: "allowance_type_id", select: "name" }).select("allowance_type_id type amount").lean(),
      HrmDeductionModel.find({ ...companyScope(companyId), employee_id: userId }).populate({ path: "deduction_type_id", select: "name" }).select("deduction_type_id type amount").lean(),
      HrmLoanModel.find({ ...companyScope(companyId), employee_id: userId }).populate({ path: "loan_type_id", select: "name" }).select("loan_type_id type amount").lean(),
      HrmOvertimeModel.find({ ...companyScope(companyId), employee_id: userId }).select("title hours rate start_date end_date").lean(),
    ]);
    return { employee: emp, allowances, deductions, loans, overtimes };
  },

  async updateEmployeeSalary(req: AuthRequest, employeeProfileId: string, body: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    const updated = await HrmEmployeeModel.findOneAndUpdate(
      { _id: employeeProfileId, ...companyScope(companyId) },
      {
        $set: {
          basic_salary: body.basic_salary,
          hours_per_day: body.hours_per_day,
          days_per_week: body.days_per_week,
          rate_per_hour: body.rate_per_hour,
        },
      },
      { new: true }
    );
    if (!updated) throw new AppError(httpStatus.NOT_FOUND, "Employee not found");
    return updated;
  },
};
