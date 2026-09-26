import { TLeadStage } from "./leadStage.interface";
import { LeadStageModel } from "./leadStage.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const createDB = async (payload: TLeadStage) => {
  return await LeadStageModel.create(payload);
};

const getAllDB = async (user_id: string, pipeline_id?: string) => {
  const filter: Record<string, unknown> = { user_id, isDeleted: false };
  if (pipeline_id) filter.pipeline_id = pipeline_id;
  return await LeadStageModel.find(filter).sort({ order: 1, createdAt: 1 });
};

const getSingleDB = async (id: string, user_id: string) => {
  return await LeadStageModel.findOne({ _id: id, user_id, isDeleted: false });
};

const updateDB = async (id: string, payload: Partial<TLeadStage>, user_id: string) => {
  return await LeadStageModel.findOneAndUpdate({ _id: id, user_id }, payload, { new: true });
};

const deleteDBOne = async (id: string, user_id: string) => {
  return await LeadStageModel.findOneAndUpdate({ _id: id, user_id, isDeleted: false }, { isDeleted: true }, { new: true });
};

// Bulk-reorder the kanban columns: body { items: [{ id, order }] }.
const updateOrderDB = async (user_id: string, items: { id: string; order: number }[]) => {
  const ops = (items || []).map((it) => ({
    updateOne: { filter: { _id: it.id, user_id }, update: { order: it.order } }
  }));
  if (ops.length) await LeadStageModel.bulkWrite(ops);
  return await LeadStageModel.find({ user_id }).sort({ order: 1 });
};

const deleteDB = withBulkDeleteId(deleteDBOne);

export const leadStageService = { createDB, getAllDB, getSingleDB, updateDB, deleteDB, updateOrderDB };
