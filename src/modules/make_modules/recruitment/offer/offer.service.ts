import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../../errors/AppError";
import { AuthRequest } from "../../../../middlewares/auth";
import { permission } from "../../../../utils/permission";
import { role } from "../../../../utils/role";
import { createRecruitmentCrudService } from "../recruitment.crud.service";
import {
  assertCompanyRef,
  assertHrmDepartment,
  companyObjectId,
  companyScope,
  creatorObjectId,
  formatDateOnly,
  generateSequentialCode,
  parseDate,
  refName,
  resolveCompanyId,
} from "../recruitment.utils";
import { CandidateModel } from "../candidate/candidate.model";
import { OfferModel } from "./offer.model";
import { TOffer, offerApprovalStatuses } from "./offer.interface";
import { UserModel } from "../../../basic_modules/user/user.model";
import { HrmEmployeeModel } from "../../hrm/models/employee.models";
import { offerLetterService } from "./offerLetter.service";

const P = permission.recruitment.offers;

const prepare = async (body: Record<string, unknown>, req: AuthRequest) => {
  const companyId = resolveCompanyId(req);
  await assertCompanyRef(CandidateModel, body.candidate_id, companyId, "Candidate");
  await assertHrmDepartment(body.department_id, companyId);
  (["offer_date", "start_date", "expiration_date", "response_date"] as const).forEach((k) => {
    if (body[k] !== undefined && body[k] !== null && body[k] !== "") {
      body[k] = parseDate(body[k], k.replace("_", " "));
    }
  });
  return body;
};

const populate = [
  { path: "candidate_id", select: "first_name last_name email" },
  { path: "job_id", select: "title" },
  { path: "department_id", select: "department_name" },
  { path: "approved_by", select: "name" },
];

const withDownloadUrl = (item: Record<string, unknown>, req?: AuthRequest) => {
  if (!req || !item._id) return item;
  return {
    ...item,
    download_url: offerLetterService.buildDownloadUrl(req, String(item._id)),
  };
};

const format = (d: TOffer, req?: AuthRequest) =>
  withDownloadUrl(
    {
      _id: d._id,
      candidate_id: refName(d.candidate_id, "first_name"),
      job_id: refName(d.job_id, "title"),
      offer_date: formatDateOnly(d.offer_date),
      position: d.position,
      department_id: refName(d.department_id, "department_name"),
      salary: d.salary,
      bonus: d.bonus ?? null,
      equity: d.equity ?? null,
      benefits: d.benefits ?? null,
      start_date: formatDateOnly(d.start_date),
      expiration_date: formatDateOnly(d.expiration_date),
      offer_letter_path: d.offer_letter_path ?? null,
      status: d.status,
      response_date: formatDateOnly(d.response_date),
      decline_reason: d.decline_reason ?? null,
      converted_to_employee: d.converted_to_employee,
      employee_id: d.employee_id ?? null,
      approval_status: d.approval_status,
      approved_by: refName(d.approved_by),
      createdAt: d.createdAt,
    },
    req,
  );

const base = createRecruitmentCrudService<TOffer>({
  model: OfferModel,
  label: "Offer",
  perms: { manageAny: P.manage_any_offers, manageOwn: P.manage_own_offers },
  searchFields: ["position", "equity"],
  populate,
  beforeCreate: prepare,
  beforeUpdate: prepare,
  formatItem: (d) => format(d),
});

const list = async (req: AuthRequest, query: Record<string, unknown>) => {
  const result = await base.list(req, query);
  return {
    ...result,
    data: result.data.map((row) => withDownloadUrl(row as Record<string, unknown>, req)),
  };
};

const single = async (req: AuthRequest, id: string) => format((await base.getOwned(req, id)) as unknown as TOffer, req);

const create = async (req: AuthRequest, body: Record<string, unknown>) => {
  const result = await base.create(req, body);
  return withDownloadUrl(result as Record<string, unknown>, req);
};

const update = async (req: AuthRequest, id: string, body: Record<string, unknown>) => {
  const result = await base.update(req, id, body);
  return withDownloadUrl(result as Record<string, unknown>, req);
};

/** updateApprovalStatus: Approved / Rejected / Pending. Records approver. */
const updateApprovalStatus = async (req: AuthRequest, id: string, status: unknown) => {
  const s = String(status);
  if (!(offerApprovalStatuses as readonly string[]).includes(s)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Invalid approval status. Allowed: ${offerApprovalStatuses.join(", ")}`
    );
  }
  const doc = await base.getOwned(req, id);
  doc.approval_status = s;
  doc.approved_by = creatorObjectId(req);
  await doc.save();
  return format(doc as unknown as TOffer, req);
};

/** Laravel sendEmail — marks sent and returns download link for the candidate email. */
const sendEmail = async (req: AuthRequest, id: string) => {
  const doc = await base.getOwned(req, id);
  doc.status = "Sent";
  await doc.save();

  const letter = await offerLetterService.buildOfferLetterDocument(req, id);
  const candidate =
    letter?.offer?.candidate ||
    (doc.candidate_id && typeof doc.candidate_id === "object" && "first_name" in doc.candidate_id
      ? doc.candidate_id
      : null);

  return {
    ...format(doc as unknown as TOffer, req),
    email_payload: {
      candidate_name: candidate
        ? `${(candidate as { first_name?: string }).first_name ?? ""} ${(candidate as { last_name?: string }).last_name ?? ""}`.trim()
        : "Candidate",
      candidate_email:
        candidate && typeof candidate === "object" && "email" in candidate
          ? (candidate as { email?: string }).email
          : null,
      position: doc.position,
      salary: doc.salary != null ? `$${Number(doc.salary).toLocaleString("en-US")}` : "To be discussed",
      start_date: formatDateOnly(doc.start_date),
      company_name: letter?.companyName ?? null,
      download_url: letter?.download_url ?? offerLetterService.buildDownloadUrl(req, id),
    },
  };
};

/**
 * Laravel downloadOfferLetter — template merge + HTML (or uploaded file path if set).
 */
const downloadOfferLetter = async (req: AuthRequest, id: string) => {
  await base.getOwned(req, id);
  const document = await offerLetterService.buildOfferLetterDocument(req, id);

  if (!document) {
    throw new AppError(httpStatus.NOT_FOUND, "Offer not found");
  }

  return document;
};

/**
 * Laravel convertToEmployee: create a staff User + HRM Employee from the offer,
 * mark the offer converted and the candidate hired.
 */
const convertToEmployee = async (req: AuthRequest, id: string, body: Record<string, unknown>) => {
  const companyId = resolveCompanyId(req);
  const offer = await base.getOwned(req, id);
  if (offer.converted_to_employee) {
    throw new AppError(httpStatus.BAD_REQUEST, "This offer has already been converted to an employee");
  }

  const candidate = await CandidateModel.findOne({ _id: offer.candidate_id, ...companyScope(companyId) });
  if (!candidate) throw new AppError(httpStatus.NOT_FOUND, "Candidate not found for this offer");

  const existingUser = await UserModel.findOne({ email: candidate.email });
  if (existingUser) {
    throw new AppError(httpStatus.CONFLICT, "A user with the candidate's email already exists");
  }

  const user = await UserModel.create({
    name: `${candidate.first_name} ${candidate.last_name}`.trim(),
    email: candidate.email,
    password: (body.password as string) || "Password@123",
    role: role.staff,
    companyId: companyObjectId(companyId),
    isVerify: true,
  });

  const employee_id =
    (body.employee_id as string) ||
    (await generateSequentialCode(HrmEmployeeModel, companyId, "EMP", "employee_id"));

  const employee = await HrmEmployeeModel.create({
    user_id: companyObjectId(companyId),
    creator_id: creatorObjectId(req),
    employee_user_id: user._id,
    employee_id,
    branch_id: body.branch_id,
    department_id: offer.department_id ?? body.department_id,
    designation_id: body.designation_id,
    basic_salary: offer.salary,
    date_of_joining: offer.start_date,
  });

  offer.converted_to_employee = true;
  offer.employee_id = employee._id as Types.ObjectId;
  await offer.save();

  candidate.status = "Hired";
  await candidate.save();

  return { offer: format(offer as unknown as TOffer, req), employee };
};

export const offerService = {
  ...base,
  list,
  single,
  create,
  update,
  updateApprovalStatus,
  sendEmail,
  downloadOfferLetter,
  convertToEmployee,
};
