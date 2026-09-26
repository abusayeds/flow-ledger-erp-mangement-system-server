import { TPipeline } from "./pipeline.interface";
import { PipelineModel } from "./pipeline.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const createDB = async (payload: TPipeline) => {
  return await PipelineModel.create(payload);
};

const getAllDB = async (user_id: string) => {
  return await PipelineModel.find({ user_id, isDeleted: false }).sort({ createdAt: -1 });
};

const getSingleDB = async (id: string, user_id: string) => {
  return await PipelineModel.findOne({ _id: id, user_id, isDeleted: false });
};

const updateDB = async (id: string, payload: Partial<TPipeline>, user_id: string) => {
  return await PipelineModel.findOneAndUpdate({ _id: id, user_id }, payload, { new: true });
};

const deleteDBOne = async (id: string, user_id: string) => {
  return await PipelineModel.findOneAndUpdate({ _id: id, user_id, isDeleted: false }, { isDeleted: true }, { new: true });
};

const deleteDB = withBulkDeleteId(deleteDBOne);

export const pipelineService = { createDB, getAllDB, getSingleDB, updateDB, deleteDB };
