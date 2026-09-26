import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import { HrmAllowanceModel, HrmDeductionModel, HrmEmployeeModel, HrmLoanModel, HrmOvertimeModel } from "../models";
import { companyScope, creatorObjectId, parseDate, resolveCompanyId } from "../shared/hrm.utils";
import { AuthRequest } from "../../../../middlewares/auth";
import { withBulkDeleteAuthId, runBulkDelete, parseDeleteIdsFromParam } from "../../../../utils/bulkDelete";

const getEmployeeUserId = async (companyId: string, profileId: string) => {
  const emp = await HrmEmployeeModel.findOne({ _id: profileId, ...companyScope(companyId) }).lean();
  if (!emp) throw new AppError(httpStatus.NOT_FOUND, "Employee not found");
  return emp.employee_user_id;
};

const deleteAllowanceOne = async (req: AuthRequest, oneId: string) => {
  await HrmAllowanceModel.findOneAndUpdate({ _id: oneId, ...companyScope(resolveCompanyId(req)) }, { isDeleted: true });
  return { _id: oneId };
};

const deleteAllowance = withBulkDeleteAuthId(deleteAllowanceOne);

const deleteDeductionOne = async (req: AuthRequest, id: string, profileId: string) => {
  await HrmDeductionModel.findOneAndUpdate(
    { _id: id, employee_id: await getEmployeeUserId(resolveCompanyId(req), profileId), ...companyScope(resolveCompanyId(req)) },
    { isDeleted: true }
  );
  return { _id: id };
};

const deleteDeduction = async (req: AuthRequest, id: string, profileId: string) =>
  runBulkDelete(parseDeleteIdsFromParam(id), (oneId) => deleteDeductionOne(req, oneId, profileId));

const deleteLoanOne = async (req: AuthRequest, id: string, profileId: string) => {
  await HrmLoanModel.findOneAndUpdate(
    { _id: id, employee_id: await getEmployeeUserId(resolveCompanyId(req), profileId), ...companyScope(resolveCompanyId(req)) },
    { isDeleted: true }
  );
  return { _id: id };
};

const deleteLoan = async (req: AuthRequest, id: string, profileId: string) =>
  runBulkDelete(parseDeleteIdsFromParam(id), (oneId) => deleteLoanOne(req, oneId, profileId));

const deleteOvertimeOne = async (req: AuthRequest, id: string, profileId: string) => {
  await HrmOvertimeModel.findOneAndUpdate(
    { _id: id, employee_id: await getEmployeeUserId(resolveCompanyId(req), profileId), ...companyScope(resolveCompanyId(req)) },
    { isDeleted: true }
  );
  return { _id: id };
};

const deleteOvertime = async (req: AuthRequest, id: string, profileId: string) =>
  runBulkDelete(parseDeleteIdsFromParam(id), (oneId) => deleteOvertimeOne(req, oneId, profileId));

export const salaryComponentsService = {
  async createAllowance(req: AuthRequest, profileId: string, body: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    const doc = await HrmAllowanceModel.create({
      employee_id: await getEmployeeUserId(companyId, profileId),
      allowance_type_id: body.allowance_type_id,
      type: body.type,
      amount: body.amount,
      user_id: companyScope(companyId).user_id,
      creator_id: creatorObjectId(req),
      isDeleted: false,
    });
    return doc;
  },
  async updateAllowance(req: AuthRequest, id: string, body: Record<string, unknown>) {
    return HrmAllowanceModel.findOneAndUpdate(
      { _id: id, ...companyScope(resolveCompanyId(req)) },
      { $set: body },
      { new: true }
    );
  },
  deleteAllowance,
  async createDeduction(req: AuthRequest, profileId: string, body: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    return HrmDeductionModel.create({
      employee_id: await getEmployeeUserId(companyId, profileId),
      deduction_type_id: body.deduction_type_id,
      type: body.type,
      amount: body.amount,
      user_id: companyScope(companyId).user_id,
      creator_id: creatorObjectId(req),
      isDeleted: false,
    });
  },
  async updateDeduction(req: AuthRequest, id: string, body: Record<string, unknown>) {
    return HrmDeductionModel.findOneAndUpdate(
      { _id: id, ...companyScope(resolveCompanyId(req)) },
      { $set: body },
      { new: true }
    );
  },
  deleteDeduction,
  async createLoan(req: AuthRequest, profileId: string, body: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    return HrmLoanModel.create({
      title: body.title,
      employee_id: await getEmployeeUserId(companyId, profileId),
      loan_type_id: body.loan_type_id,
      type: body.type,
      amount: body.amount,
      start_date: parseDate(body.start_date),
      end_date: parseDate(body.end_date),
      reason: body.reason,
      user_id: companyScope(companyId).user_id,
      creator_id: creatorObjectId(req),
      isDeleted: false,
    });
  },
  async updateLoan(req: AuthRequest, id: string, body: Record<string, unknown>) {
    const patch = { ...body };
    if (body.start_date) patch.start_date = parseDate(body.start_date);
    if (body.end_date) patch.end_date = parseDate(body.end_date);
    return HrmLoanModel.findOneAndUpdate(
      { _id: id, ...companyScope(resolveCompanyId(req)) },
      { $set: patch },
      { new: true }
    );
  },
  deleteLoan,
  async createOvertime(req: AuthRequest, profileId: string, body: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    return HrmOvertimeModel.create({
      title: body.title,
      employee_id: await getEmployeeUserId(companyId, profileId),
      total_days: body.total_days,
      hours: body.hours,
      rate: body.rate,
      start_date: parseDate(body.start_date),
      end_date: parseDate(body.end_date),
      notes: body.notes,
      user_id: companyScope(companyId).user_id,
      creator_id: creatorObjectId(req),
      isDeleted: false,
    });
  },
  async updateOvertime(req: AuthRequest, id: string, body: Record<string, unknown>) {
    const patch = { ...body };
    if (body.start_date) patch.start_date = parseDate(body.start_date);
    if (body.end_date) patch.end_date = parseDate(body.end_date);
    return HrmOvertimeModel.findOneAndUpdate(
      { _id: id, ...companyScope(resolveCompanyId(req)) },
      { $set: patch },
      { new: true }
    );
  },
  deleteOvertime,
};
