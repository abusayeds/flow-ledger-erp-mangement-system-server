import { TDealStage } from "./dealStage.interface";
import { DealStageModel } from "./dealStage.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const createDB = async (payload: TDealStage) => {
  return await DealStageModel.create(payload);
};

const getAllDB = async (user_id: string, pipeline_id?: string) => {
  const filter: Record<string, unknown> = { user_id, isDeleted: false };
  if (pipeline_id) filter.pipeline_id = pipeline_id;
  return await DealStageModel.find(filter).sort({ order: 1, createdAt: 1 });
};

const getSingleDB = async (id: string, user_id: string) => {
  return await DealStageModel.findOne({ _id: id, user_id, isDeleted: false });
};

const updateDB = async (id: string, payload: Partial<TDealStage>, user_id: string) => {
  return await DealStageModel.findOneAndUpdate({ _id: id, user_id }, payload, { new: true });
};

const deleteDBOne = async (id: string, user_id: string) => {
  return await DealStageModel.findOneAndUpdate({ _id: id, user_id, isDeleted: false }, { isDeleted: true }, { new: true });
};

// Bulk-reorder the kanban columns: body { items: [{ id, order }] }.
const updateOrderDB = async (user_id: string, items: { id: string; order: number }[]) => {
  const ops = (items || []).map((it) => ({
    updateOne: { filter: { _id: it.id, user_id }, update: { order: it.order } }
  }));
  if (ops.length) await DealStageModel.bulkWrite(ops);
  return await DealStageModel.find({ user_id }).sort({ order: 1 });
};

const deleteDB = withBulkDeleteId(deleteDBOne);

export const dealStageService = { createDB, getAllDB, getSingleDB, updateDB, deleteDB, updateOrderDB };
