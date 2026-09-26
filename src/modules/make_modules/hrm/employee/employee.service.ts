import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { UserModel } from "../../../basic_modules/user/user.model";

import {
  HrmBranchModel,
  HrmDepartmentModel,
  HrmDesignationModel,
  HrmEmployeeDocumentModel,
  HrmEmployeeDocumentTypeModel,
  HrmEmployeeModel,
  HrmShiftModel,
} from "../models";
import { employeeListSearchNested } from "../shared/hrm.employeeSearch";
import {
  applyOwnershipToQuery,
  companyObjectId,
  companyScope,
  creatorObjectId,
  EMPLOYEE_USER_ROLES,
  resolveCompanyId,
  resolveOwnership,
} from "../shared/hrm.utils";
import { AuthRequest } from "../../../../middlewares/auth";
import { permModule } from "../../../../utils/permissionModule";
import { validateEmployeeProfileRefs } from "./employee.validation";
import { parseOptionalObjectId } from "../shared/hrm.refValidation";
import { withBulkDeleteAuthId, runBulkDelete, parseDeleteIdsFromParam } from "../../../../utils/bulkDelete";

const lean = (doc: Record<string, unknown>) => ({
  ...doc,
  _id: doc._id ? String(doc._id) : undefined,
});

export const generateEmployeeId = async (companyId: string) => {
  const year = new Date().getFullYear();
  const prefix = `EMP${year}`;
  // Include soft-deleted rows: the unique index ({ employee_id, user_id }) still
  // holds their codes, so skipping them here would regenerate a colliding id.
  const last = await HrmEmployeeModel.findOne({
    user_id: companyObjectId(companyId),
    employee_id: new RegExp(`^${prefix}`),
  })
    .sort({ employee_id: -1 })
    .lean();
  let next = 1;
  if (last?.employee_id) {
    const part = parseInt(String(last.employee_id).slice(-4), 10);
    if (!Number.isNaN(part)) next = part + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
};

const assertStaffUser = async (companyId: string, userId: string) => {
  const user = await UserModel.findOne({
    _id: userId,
    companyId: companyObjectId(companyId),
    role: { $in: EMPLOYEE_USER_ROLES },
    isDeleted: false,
  }).lean();
  if (!user) throw new AppError(httpStatus.BAD_REQUEST, "Invalid employee user");
  return user;
};

const removeOne = async (req: AuthRequest, oneId: string) => {
  const companyId = resolveCompanyId(req);
  await HrmEmployeeModel.findOneAndUpdate({ _id: oneId, ...companyScope(companyId) }, { isDeleted: true });
  return { _id: oneId };
};

const remove = withBulkDeleteAuthId(removeOne);

const deleteDocumentOne = async (req: AuthRequest, employeeProfileId: string, documentId: string) => {
  const companyId = resolveCompanyId(req);
  const updated = await HrmEmployeeDocumentModel.findOneAndUpdate(
    { _id: documentId, employee_profile_id: employeeProfileId, ...companyScope(companyId), isDeleted: false },
    { isDeleted: true },
    { new: true }
  ).lean();
  if (!updated) throw new AppError(httpStatus.NOT_FOUND, "Document not found");
  return { _id: documentId };
};

const deleteDocument = async (req: AuthRequest, employeeProfileId: string, documentId: string) =>
  runBulkDelete(parseDeleteIdsFromParam(documentId), (oneId) =>
    deleteDocumentOne(req, employeeProfileId, oneId),
  );

export const employeeService = {
  async generateId(req: AuthRequest) {
    return { employee_id: await generateEmployeeId(resolveCompanyId(req)) };
  },

  async list(req: AuthRequest, query: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    const ownership = resolveOwnership(
      req,
      permModule.manageAny("employees"),
      permModule.manageOwn("employees"),
    );
    const base = applyOwnershipToQuery(companyScope(companyId), ownership);
    if (query.branch_id) (base as Record<string, unknown>).branch_id = query.branch_id;
    if (query.department_id) (base as Record<string, unknown>).department_id = query.department_id;
    if (query.employment_type !== undefined && query.employment_type !== "")
      (base as Record<string, unknown>).employment_type = query.employment_type;
    if (query.gender !== undefined && query.gender !== "")
      (base as Record<string, unknown>).gender = query.gender;
    let mq = HrmEmployeeModel.find(base)
      .populate("employee_user_id", "name email image , role")
      .populate("branch_id", "branch_name")
      .populate("department_id", "department_name")
      .populate("designation_id", "designation_name")
      .populate("shift_id", "shift_name");
    const qb = new queryBuilder(mq, query);
    await qb.searchNested(employeeListSearchNested(companyId));
    qb.filter().sort().fields();
    const { totalData } = await qb.paginate(HrmEmployeeModel.find(base));
    const rows = await qb.modelQuery.lean().exec();
    const data = (rows as unknown as Record<string, unknown>[]).map(lean);
    const pagination = qb.calculatePagination({
      totalData,
      currentPage: Number(query?.page) || 1,
      limit: Number(query?.limit) || 10,
    });
    return { data, pagination };
  },

  async get(req: AuthRequest, id: string) {
    const companyId = resolveCompanyId(req);
    const doc = await HrmEmployeeModel.findOne({ _id: id, ...companyScope(companyId) })
      .populate("employee_user_id", "name email image phone")
      .populate("branch_id")
      .populate("department_id")
      .populate("designation_id")
      .populate("shift_id")
      .lean();
    if (!doc) throw new AppError(httpStatus.NOT_FOUND, "Employee not found");
    const docs = await HrmEmployeeDocumentModel.find({
      ...companyScope(companyId),
      employee_profile_id: doc._id,
      isDeleted: false,
    })
      .populate("document_type_id")
      .lean();
    return { ...lean(doc as Record<string, unknown>), documents: docs.map(lean) };
  },

  async create(req: AuthRequest, body: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    const userId = String(body.user_id ?? body.employee_user_id ?? "");
    if (!userId) throw new AppError(httpStatus.BAD_REQUEST, "user_id is required");
    const userOid = parseOptionalObjectId(userId, "user_id", "Employee user");
    if (!userOid) throw new AppError(httpStatus.BAD_REQUEST, "user_id is required");
    await assertStaffUser(companyId, userOid);
    await validateEmployeeProfileRefs(companyId, body);
    const exists = await HrmEmployeeModel.findOne({
      ...companyScope(companyId),
      employee_user_id: userId,
      isDeleted: false,
    });
    if (exists) throw new AppError(httpStatus.CONFLICT, "Employee profile already exists for this user");

    const employee_id = body.employee_id
      ? String(body.employee_id)
      : await generateEmployeeId(companyId);

    const created = await HrmEmployeeModel.create({
      ...body,
      employee_id,
      employee_user_id: userId,
      user_id: companyObjectId(companyId),
      creator_id: creatorObjectId(req),
      isDeleted: false,
      date_of_birth: body.date_of_birth ? new Date(String(body.date_of_birth)) : undefined,
      date_of_joining: body.date_of_joining ? new Date(String(body.date_of_joining)) : undefined,
    });
    return lean(created.toObject() as unknown as Record<string, unknown>);
  },

  async update(req: AuthRequest, id: string, body: Record<string, unknown>) {
    const companyId = resolveCompanyId(req);
    delete body.user_id;
    delete body.employee_user_id;
    await validateEmployeeProfileRefs(companyId, body, { partial: true });
    const updated = await HrmEmployeeModel.findOneAndUpdate(
      { _id: id, ...companyScope(companyId) },
      {
        $set: {
          ...body,
          date_of_birth: body.date_of_birth ? new Date(String(body.date_of_birth)) : undefined,
          date_of_joining: body.date_of_joining ? new Date(String(body.date_of_joining)) : undefined,
        },
      },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) throw new AppError(httpStatus.NOT_FOUND, "Employee not found");
    return lean(updated as Record<string, unknown>);
  },

  remove,

  async eligibleUsers(req: AuthRequest) {
    const companyId = resolveCompanyId(req);
    const linked = await HrmEmployeeModel.find({ ...companyScope(companyId), isDeleted: false }).distinct(
      "employee_user_id"
    );
    return UserModel.find({
      companyId: companyObjectId(companyId),
      role: { $in: EMPLOYEE_USER_ROLES },
      isDeleted: false,
      _id: { $nin: linked },
    })
      .select("name email role image")
      .lean();
  },

  async lookups(req: AuthRequest) {
    const companyId = resolveCompanyId(req);
    const scope = companyScope(companyId);
    const [branches, departments, designations, shifts, documentTypes] = await Promise.all([
      HrmBranchModel.find(scope).select("branch_name").lean(),
      HrmDepartmentModel.find(scope).select("department_name branch_id").lean(),
      HrmDesignationModel.find(scope).select("designation_name branch_id department_id").lean(),
      HrmShiftModel.find(scope).select("shift_name").lean(),
      HrmEmployeeDocumentTypeModel.find(scope).select("document_name is_required").lean(),
    ]);
    return { branches, departments, designations, shifts, documentTypes };
  },

  deleteDocument,
};
