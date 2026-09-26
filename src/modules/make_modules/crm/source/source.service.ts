import { TSource } from "./source.interface";
import { SourceModel } from "./source.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const createDB = async (payload: TSource) => {
  return await SourceModel.create(payload);
};

const getAllDB = async (user_id: string) => {
  return await SourceModel.find({ user_id, isDeleted: false }).sort({ createdAt: -1 });
};

const getSingleDB = async (id: string, user_id: string) => {
  return await SourceModel.findOne({ _id: id, user_id, isDeleted: false });
};

const updateDB = async (id: string, payload: Partial<TSource>, user_id: string) => {
  return await SourceModel.findOneAndUpdate({ _id: id, user_id }, payload, { new: true });
};

const deleteDBOne = async (id: string, user_id: string) => {
  return await SourceModel.findOneAndUpdate({ _id: id, user_id, isDeleted: false }, { isDeleted: true }, { new: true });
};

const deleteDB = withBulkDeleteId(deleteDBOne);

export const sourceService = { createDB, getAllDB, getSingleDB, updateDB, deleteDB };
