import { TDeal } from "./deal.interface";
import { DealModel } from "./deal.model";
import { pushSub, updateSub, pullSub, addRef, removeRef, setRefs } from "../shared/crm.subdoc";
import { withBulkDeleteId, withBulkDeleteIdThird } from "../../../../utils/bulkDelete";

const LIST_POP = [
  { path: "stage_id", select: "name" },
  { path: "labels", select: "name color" },
  { path: "assigned_users", select: "name email" },
  { path: "clients", select: "name email" },
];
const FULL_POP = [
  { path: "pipeline_id", select: "name" },
  { path: "stage_id", select: "name" },
  { path: "sources", select: "name" },
  { path: "labels", select: "name color" },
  { path: "products", select: "productName pricing" },
  { path: "assigned_users", select: "name email" },
  { path: "clients", select: "name email" },
];

const createDB = async (payload: TDeal) => DealModel.create(payload);

const getAllDB = async (user_id: string, query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = { user_id, isDeleted: false };
  if (query.pipeline_id) filter.pipeline_id = query.pipeline_id;
  if (query.stage_id) filter.stage_id = query.stage_id;
  return DealModel.find(filter).populate(LIST_POP).sort({ order: 1, createdAt: -1 });
};

const getSingleDB = async (id: string, user_id: string) =>
  DealModel.findOne({ _id: id, user_id, isDeleted: false }).populate(FULL_POP);

const updateDB = async (id: string, payload: Partial<TDeal>, user_id: string) =>
  DealModel.findOneAndUpdate({ _id: id, user_id }, payload, { new: true, runValidators: true });

const deleteDBOne = async (id: string, user_id: string) =>
  DealModel.findOneAndUpdate({ _id: id, user_id }, { isDeleted: true }, { new: true });

// Kanban move/reorder: items [{ id, stage_id?, order }].
const orderDB = async (user_id: string, items: { id: string; stage_id?: string; order: number }[]) => {
  const ops = (items || []).map((it) => ({
    updateOne: {
      filter: { _id: it.id, user_id },
      update: { ...(it.stage_id ? { stage_id: it.stage_id } : {}), order: it.order }
    }
  }));
  if (ops.length) await DealModel.bulkWrite(ops);
  return DealModel.find({ user_id }).sort({ order: 1 });
};

const changeStatusDB = async (id: string, user_id: string, status: string) =>
  DealModel.findOneAndUpdate({ _id: id, user_id }, { status }, { new: true });

const setLabelsDB = (id: string, user_id: string, labels: string[]) => setRefs(DealModel, id, user_id, "labels", labels);

const addUserDB = (id: string, user_id: string, v: string) => addRef(DealModel, id, user_id, "assigned_users", v);
const removeUserDB = withBulkDeleteIdThird((id, user_id, v) => removeRef(DealModel, id, user_id, "assigned_users", v));
const addProductDB = (id: string, user_id: string, v: string) => addRef(DealModel, id, user_id, "products", v);
const removeProductDB = withBulkDeleteIdThird((id, user_id, v) => removeRef(DealModel, id, user_id, "products", v));
const addSourceDB = (id: string, user_id: string, v: string) => addRef(DealModel, id, user_id, "sources", v);
const removeSourceDB = withBulkDeleteIdThird((id, user_id, v) => removeRef(DealModel, id, user_id, "sources", v));
const addClientDB = (id: string, user_id: string, v: string) => addRef(DealModel, id, user_id, "clients", v);
const removeClientDB = withBulkDeleteIdThird((id, user_id, v) => removeRef(DealModel, id, user_id, "clients", v));

const addTaskDB = (id: string, user_id: string, d: Record<string, unknown>) => pushSub(DealModel, id, user_id, "tasks", d);
const updateTaskDB = (id: string, user_id: string, s: string, d: Record<string, unknown>) => updateSub(DealModel, id, user_id, "tasks", s, d);
const removeTaskDB = withBulkDeleteIdThird((id, user_id, s) => pullSub(DealModel, id, user_id, "tasks", s));
const addCallDB = (id: string, user_id: string, d: Record<string, unknown>) => pushSub(DealModel, id, user_id, "calls", d);
const updateCallDB = (id: string, user_id: string, s: string, d: Record<string, unknown>) => updateSub(DealModel, id, user_id, "calls", s, d);
const removeCallDB = withBulkDeleteIdThird((id, user_id, s) => pullSub(DealModel, id, user_id, "calls", s));
const addEmailDB = (id: string, user_id: string, d: Record<string, unknown>) => pushSub(DealModel, id, user_id, "emails", d);
const removeEmailDB = withBulkDeleteIdThird((id, user_id, s) => pullSub(DealModel, id, user_id, "emails", s));
const addDiscussionDB = (id: string, user_id: string, d: Record<string, unknown>) => pushSub(DealModel, id, user_id, "discussions", d);
const removeDiscussionDB = withBulkDeleteIdThird((id, user_id, s) => pullSub(DealModel, id, user_id, "discussions", s));
const addFileDB = (id: string, user_id: string, d: Record<string, unknown>) => pushSub(DealModel, id, user_id, "files", d);
const removeFileDB = withBulkDeleteIdThird((id, user_id, s) => pullSub(DealModel, id, user_id, "files", s));

const deleteDB = withBulkDeleteId(deleteDBOne);

export const dealService = {
  createDB, getAllDB, getSingleDB, updateDB, deleteDB, orderDB, changeStatusDB, setLabelsDB,
  addUserDB, removeUserDB, addProductDB, removeProductDB, addSourceDB, removeSourceDB, addClientDB, removeClientDB,
  addTaskDB, updateTaskDB, removeTaskDB, addCallDB, updateCallDB, removeCallDB,
  addEmailDB, removeEmailDB, addDiscussionDB, removeDiscussionDB, addFileDB, removeFileDB,
};
