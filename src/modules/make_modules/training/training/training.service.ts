import httpStatus from "http-status";
import { FilterQuery } from "mongoose";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { AuthRequest } from "../../../../middlewares/auth";
import { permission } from "../../../../utils/permission";
import {
  assertCompanyRef,
  assertHrmBranch,
  assertHrmDepartment,
  companyObjectId,
  companyScope,
  creatorObjectId,
  formatDateOnly,
  parseDate,
  refName,
  resolveCompanyId,
  resolveOwnership,
} from "../training.utils";
import { TrainingModel } from "./training.model";
import { TTraining } from "./training.interface";
import { TrainingTypeModel } from "../trainingType/trainingType.model";
import { TrainerModel } from "../trainer/trainer.model";
import { TrainingTaskModel } from "../trainingTask/trainingTask.model";
import { withBulkDeleteAuthId } from "../../../../utils/bulkDelete";

const P = permission.training.training;
const STATUSES = ["scheduled", "ongoing", "completed", "cancelled"];

const populateRefs = [
  { path: "training_type_id", select: "name" },
  { path: "trainer_id", select: "name" },
  { path: "branch_id", select: "branch_name" },
  { path: "department_id", select: "department_name" },
];

const format = (d: TTraining) => ({
  _id: d._id,
  title: d.title,
  description: d.description ?? null,
  training_type_id: refName(d.training_type_id),
  trainer_id: refName(d.trainer_id),
  branch_id: refName(d.branch_id, "branch_name"),
  department_id: refName(d.department_id, "department_name"),
  start_date: formatDateOnly(d.start_date),
  end_date: formatDateOnly(d.end_date),
  start_time: d.start_time,
  end_time: d.end_time,
  location: d.location ?? null,
  max_participants: d.max_participants ?? null,
  cost: d.cost ?? null,
  status: d.status,
  createdAt: d.createdAt,
});

/**
 * Company / HR & manage-any -> every training in the company.
 * manage-own -> trainings the user created OR has a task assigned to them (Laravel orWhereHas tasks).
 */
const ownershipFilter = async (req: AuthRequest): Promise<FilterQuery<TTraining>> => {
  const companyId = resolveCompanyId(req);
  const ownership = resolveOwnership(req, P.manage_any_trainings, P.manage_own_trainings);
  const base = companyScope(companyId) as FilterQuery<TTraining>;

  if (ownership.canManageAny) return base;
  if (!ownership.canManageOwn) return { ...base, _id: { $exists: false } };

  const assignedTrainingIds = await TrainingTaskModel.distinct("training_id", {
    user_id: companyObjectId(companyId),
    assigned_to: ownership.actorId,
    isDeleted: false,
  });
  return {
    ...base,
    $or: [{ creator_id: ownership.actorId }, { _id: { $in: assignedTrainingIds } }],
  };
};

const prepare = async (body: Record<string, unknown>, req: AuthRequest) => {
  const companyId = resolveCompanyId(req);
  await assertCompanyRef(TrainingTypeModel, body.training_type_id, companyId, "Training type");
  await assertCompanyRef(TrainerModel, body.trainer_id, companyId, "Trainer");
  await assertHrmBranch(body.branch_id, companyId);
  await assertHrmDepartment(body.department_id, companyId);

  const payload: Record<string, unknown> = { ...body };
  if (body.start_date !== undefined) payload.start_date = parseDate(body.start_date, "start date");
  if (body.end_date !== undefined) payload.end_date = parseDate(body.end_date, "end date");
  if (payload.start_date && payload.end_date && payload.end_date < payload.start_date) {
    throw new AppError(httpStatus.BAD_REQUEST, "End date must be on or after the start date");
  }
  if (body.status !== undefined && !STATUSES.includes(String(body.status))) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid status");
  }
  return payload;
};

const getOwned = async (req: AuthRequest, id: string) => {
  const filter = await ownershipFilter(req);
  const doc = await TrainingModel.findOne({ ...filter, _id: id }).populate(populateRefs);
  if (!doc) throw new AppError(httpStatus.NOT_FOUND, "Training not found");
  return doc;
};

const create = async (req: AuthRequest, body: Record<string, unknown>) => {
  const companyId = resolveCompanyId(req);
  const payload = await prepare(body, req);
  const doc = await TrainingModel.create({
    ...payload,
    user_id: companyObjectId(companyId),
    creator_id: creatorObjectId(req),
    isDeleted: false,
  });
  const created = await doc.populate(populateRefs);
  return format(created as unknown as TTraining);
};

const list = async (req: AuthRequest, query: Record<string, unknown>) => {
  const base = await ownershipFilter(req);
  const qb = new queryBuilder(TrainingModel.find(base).populate(populateRefs), query)
    .search(["title", "description", "location"])
    .filter()
    .sort()
    .fields();
  const { totalData } = await qb.paginate(TrainingModel.find(base));
  const rows = await qb.modelQuery.exec();
  const data = rows.map((d) => format(d as unknown as TTraining));
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query?.limit) || 10;
  const pagination = qb.calculatePagination({ totalData, currentPage, limit });
  return { data, pagination };
};

const single = async (req: AuthRequest, id: string) =>
  format(await getOwned(req, id) as unknown as TTraining);

const update = async (req: AuthRequest, id: string, body: Record<string, unknown>) => {
  await getOwned(req, id);
  const payload = await prepare(body, req);
  delete payload.user_id;
  delete payload.creator_id;
  const companyId = resolveCompanyId(req);
  const updated = await TrainingModel.findOneAndUpdate(
    { _id: id, ...companyScope(companyId) },
    { $set: payload },
    { new: true, runValidators: true }
  ).populate(populateRefs);
  if (!updated) throw new AppError(httpStatus.NOT_FOUND, "Training not found");
  return format(updated as unknown as TTraining);
};

const removeOne = async (req: AuthRequest, id: string) => {
  await getOwned(req, id);
  const companyId = resolveCompanyId(req);
  await TrainingModel.findOneAndUpdate(
    { _id: id, ...companyScope(companyId) },
    { isDeleted: true }
  );
  return { _id: id };
};

const remove = withBulkDeleteAuthId(removeOne);

export const trainingService = { create, list, single, update, remove, getOwned };
