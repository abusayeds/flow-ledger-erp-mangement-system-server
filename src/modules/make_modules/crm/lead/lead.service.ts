import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import { TLead } from "./lead.interface";
import { LeadModel } from "./lead.model";
import { DealModel } from "../deal/deal.model";
import { DealStageModel } from "../dealStage/dealStage.model";
import { pushSub, updateSub, pullSub, addRef, removeRef, setRefs } from "../shared/crm.subdoc";
import { withBulkDeleteId, withBulkDeleteIdThird } from "../../../../utils/bulkDelete";

const LIST_POP = [
  { path: "stage_id", select: "name" },
  { path: "labels", select: "name color" },
  { path: "assigned_users", select: "name email" },
];
const FULL_POP = [
  { path: "pipeline_id", select: "name" },
  { path: "stage_id", select: "name" },
  { path: "sources", select: "name" },
  { path: "labels", select: "name color" },
  { path: "products", select: "productName pricing" },
  { path: "assigned_users", select: "name email" },
];

const createDB = async (payload: TLead) => LeadModel.create(payload);

const getAllDB = async (user_id: string, query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = { user_id, isDeleted: false };
  if (query.pipeline_id) filter.pipeline_id = query.pipeline_id;
  if (query.stage_id) filter.stage_id = query.stage_id;
  return LeadModel.find(filter).populate(LIST_POP).sort({ order: 1, createdAt: -1 });
};

const getSingleDB = async (id: string, user_id: string) =>
  LeadModel.findOne({ _id: id, user_id, isDeleted: false }).populate(FULL_POP);

const updateDB = async (id: string, payload: Partial<TLead>, user_id: string) =>
  LeadModel.findOneAndUpdate({ _id: id, user_id }, payload, { new: true, runValidators: true });

const deleteDBOne = async (id: string, user_id: string) =>
  LeadModel.findOneAndUpdate({ _id: id, user_id }, { isDeleted: true }, { new: true });

// Kanban move/reorder: items [{ id, stage_id?, order }].
const orderDB = async (user_id: string, items: { id: string; stage_id?: string; order: number }[]) => {
  const ops = (items || []).map((it) => ({
    updateOne: {
      filter: { _id: it.id, user_id },
      update: { ...(it.stage_id ? { stage_id: it.stage_id } : {}), order: it.order }
    }
  }));
  if (ops.length) await LeadModel.bulkWrite(ops);
  return LeadModel.find({ user_id }).sort({ order: 1 });
};

const setLabelsDB = (id: string, user_id: string, labels: string[]) => setRefs(LeadModel, id, user_id, "labels", labels);

const addUserDB = (id: string, user_id: string, v: string) => addRef(LeadModel, id, user_id, "assigned_users", v);
const removeUserDB = withBulkDeleteIdThird((id, user_id, v) => removeRef(LeadModel, id, user_id, "assigned_users", v));
const addProductDB = (id: string, user_id: string, v: string) => addRef(LeadModel, id, user_id, "products", v);
const removeProductDB = withBulkDeleteIdThird((id, user_id, v) => removeRef(LeadModel, id, user_id, "products", v));
const addSourceDB = (id: string, user_id: string, v: string) => addRef(LeadModel, id, user_id, "sources", v);
const removeSourceDB = withBulkDeleteIdThird((id, user_id, v) => removeRef(LeadModel, id, user_id, "sources", v));

const addTaskDB = (id: string, user_id: string, d: Record<string, unknown>) => pushSub(LeadModel, id, user_id, "tasks", d);
const updateTaskDB = (id: string, user_id: string, s: string, d: Record<string, unknown>) => updateSub(LeadModel, id, user_id, "tasks", s, d);
const removeTaskDB = withBulkDeleteIdThird((id, user_id, s) => pullSub(LeadModel, id, user_id, "tasks", s));
const addCallDB = (id: string, user_id: string, d: Record<string, unknown>) => pushSub(LeadModel, id, user_id, "calls", d);
const updateCallDB = (id: string, user_id: string, s: string, d: Record<string, unknown>) => updateSub(LeadModel, id, user_id, "calls", s, d);
const removeCallDB = withBulkDeleteIdThird((id, user_id, s) => pullSub(LeadModel, id, user_id, "calls", s));
const addEmailDB = (id: string, user_id: string, d: Record<string, unknown>) => pushSub(LeadModel, id, user_id, "emails", d);
const removeEmailDB = withBulkDeleteIdThird((id, user_id, s) => pullSub(LeadModel, id, user_id, "emails", s));
const addDiscussionDB = (id: string, user_id: string, d: Record<string, unknown>) => pushSub(LeadModel, id, user_id, "discussions", d);
const removeDiscussionDB = withBulkDeleteIdThird((id, user_id, s) => pullSub(LeadModel, id, user_id, "discussions", s));
const addFileDB = (id: string, user_id: string, d: Record<string, unknown>) => pushSub(LeadModel, id, user_id, "files", d);
const removeFileDB = withBulkDeleteIdThird((id, user_id, s) => pullSub(LeadModel, id, user_id, "files", s));

// Convert a lead into a deal: copy fields + embedded sub-arrays, drop it on the
// pipeline's first deal stage, and mark the lead converted.
const convertToDealDB = async (id: string, user_id: string, body: Record<string, unknown>) => {
  const lead = await LeadModel.findOne({ _id: id, user_id, isDeleted: false });
  if (!lead) throw new AppError(httpStatus.NOT_FOUND, "Lead not found");
  if (lead.is_converted) throw new AppError(httpStatus.BAD_REQUEST, "Lead already converted to a deal");

  const dealStage = await DealStageModel.findOne({ user_id, pipeline_id: lead.pipeline_id, isDeleted: false }).sort({ order: 1 });

  const deal = await DealModel.create({
    user_id: lead.user_id,
    creator_id: lead.creator_id || lead.user_id,
    name: lead.name,
    price: Number(body?.price) || 0,
    phone: lead.phone,
    notes: lead.notes,
    pipeline_id: lead.pipeline_id,
    stage_id: dealStage?._id,
    sources: lead.sources,
    products: lead.products,
    labels: lead.labels,
    assigned_users: lead.assigned_users,
    clients: body?.client_id ? [body.client_id] : [],
    tasks: lead.tasks,
    calls: lead.calls,
    emails: lead.emails,
    discussions: lead.discussions,
    files: lead.files,
    status: "Active",
    is_active: true,
  });

  lead.is_converted = true;
  lead.converted_deal_id = deal._id;
  await lead.save();

  return { lead, deal };
};

const deleteDB = withBulkDeleteId(deleteDBOne);

export const leadService = {
  createDB, getAllDB, getSingleDB, updateDB, deleteDB, orderDB, setLabelsDB,
  addUserDB, removeUserDB, addProductDB, removeProductDB, addSourceDB, removeSourceDB,
  addTaskDB, updateTaskDB, removeTaskDB, addCallDB, updateCallDB, removeCallDB,
  addEmailDB, removeEmailDB, addDiscussionDB, removeDiscussionDB, addFileDB, removeFileDB,
  convertToDealDB,
};
