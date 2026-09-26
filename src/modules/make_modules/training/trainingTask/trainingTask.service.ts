import httpStatus from "http-status";
import { FilterQuery } from "mongoose";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { AuthRequest } from "../../../../middlewares/auth";
import { permission } from "../../../../utils/permission";
import {
  assertEmployeeUser,
  companyObjectId,
  companyScope,
  creatorObjectId,
  formatDateOnly,
  parseDate,
  refName,
  resolveCompanyId,
  resolveOwnership,
} from "../training.utils";
import { TrainingModel } from "../training/training.model";
import { TrainingTaskModel } from "./trainingTask.model";
import { TTrainingTask } from "./trainingTask.interface";
import { withBulkDeleteAuthId } from "../../../../utils/bulkDelete";

const P = permission.training.training;

const populateRefs = [
  { path: "training_id", select: "title" },
  { path: "assigned_to", select: "name" },
];

const format = (d: TTrainingTask) => ({
  _id: d._id,
  training_id: refName(d.training_id, "title"),
  title: d.title,
  description: d.description ?? null,
  status: d.status,
  due_date: formatDateOnly(d.due_date),
  assigned_to: refName(d.assigned_to),
  createdAt: d.createdAt,
});

/** manage-own -> tasks the user created OR are assigned to them (Laravel creator_id OR assigned_to). */
const ownershipFilter = (req: AuthRequest): FilterQuery<TTrainingTask> => {
  const companyId = resolveCompanyId(req);
  const ownership = resolveOwnership(req, P.manage_any_training_tasks, P.manage_own_training_tasks);
  const base = companyScope(companyId) as FilterQuery<TTrainingTask>;

  if (ownership.canManageAny) return base;
  if (!ownership.canManageOwn) return { ...base, _id: { $exists: false } };
  return {
    ...base,
    $or: [{ creator_id: ownership.actorId }, { assigned_to: ownership.actorId }],
  };
};

/** Resolve a training the caller owns (route-bound parent) before creating/listing its tasks. */
const resolveTraining = async (req: AuthRequest, trainingId: string) => {
  const companyId = resolveCompanyId(req);
  const training = await TrainingModel.findOne({ _id: trainingId, ...companyScope(companyId) });
  if (!training) throw new AppError(httpStatus.NOT_FOUND, "Training not found");
  return training;
};

const getOwned = async (req: AuthRequest, id: string) => {
  const doc = await TrainingTaskModel.findOne({ ...ownershipFilter(req), _id: id }).populate(populateRefs);
  if (!doc) throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  return doc;
};

const create = async (req: AuthRequest, trainingId: string, body: Record<string, unknown>) => {
  const companyId = resolveCompanyId(req);
  await resolveTraining(req, trainingId);
  await assertEmployeeUser(body.assigned_to, companyId, "Assigned employee");

  const doc = await TrainingTaskModel.create({
    training_id: trainingId,
    title: body.title,
    description: body.description,
    due_date: body.due_date !== undefined ? parseDate(body.due_date, "due date") : undefined,
    assigned_to: body.assigned_to,
    status: "pending",
    user_id: companyObjectId(companyId),
    creator_id: creatorObjectId(req),
    isDeleted: false,
  });
  const created = await doc.populate(populateRefs);
  return format(created as unknown as TTrainingTask);
};

const list = async (req: AuthRequest, trainingId: string, query: Record<string, unknown>) => {
  await resolveTraining(req, trainingId);
  const base = { ...ownershipFilter(req), training_id: trainingId } as FilterQuery<TTrainingTask>;
  const qb = new queryBuilder(TrainingTaskModel.find(base).populate(populateRefs), query)
    .search(["title", "description"])
    .filter()
    .sort()
    .fields();
  const { totalData } = await qb.paginate(TrainingTaskModel.find(base));
  const rows = await qb.modelQuery.exec();
  const data = rows.map((d) => format(d as unknown as TTrainingTask));
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query?.limit) || 10;
  const pagination = qb.calculatePagination({ totalData, currentPage, limit });
  return { data, pagination };
};

const single = async (req: AuthRequest, id: string) =>
  format(await getOwned(req, id) as unknown as TTrainingTask);

const update = async (req: AuthRequest, id: string, body: Record<string, unknown>) => {
  await getOwned(req, id);
  const companyId = resolveCompanyId(req);
  if (body.assigned_to !== undefined) {
    await assertEmployeeUser(body.assigned_to, companyId, "Assigned employee");
  }
  const payload: Record<string, unknown> = {
    title: body.title,
    description: body.description,
    assigned_to: body.assigned_to,
  };
  if (body.due_date !== undefined) payload.due_date = parseDate(body.due_date, "due date");
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

  const updated = await TrainingTaskModel.findOneAndUpdate(
    { _id: id, ...companyScope(companyId) },
    { $set: payload },
    { new: true, runValidators: true }
  ).populate(populateRefs);
  if (!updated) throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  return format(updated as unknown as TTrainingTask);
};

const complete = async (req: AuthRequest, id: string) => {
  await getOwned(req, id);
  const companyId = resolveCompanyId(req);
  const updated = await TrainingTaskModel.findOneAndUpdate(
    { _id: id, ...companyScope(companyId) },
    { status: "completed" },
    { new: true }
  ).populate(populateRefs);
  if (!updated) throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  return format(updated as unknown as TTrainingTask);
};

const removeOne = async (req: AuthRequest, id: string) => {
  await getOwned(req, id);
  const companyId = resolveCompanyId(req);
  await TrainingTaskModel.findOneAndUpdate(
    { _id: id, ...companyScope(companyId) },
    { isDeleted: true }
  );
  return { _id: id };
};

const remove = withBulkDeleteAuthId(removeOne);

export const trainingTaskService = { create, list, single, update, complete, remove, getOwned };
