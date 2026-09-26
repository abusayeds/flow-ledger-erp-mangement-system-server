import { TSignature } from "./signature.interface";
import { SignatureModel } from "./signature.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const createDB = async (payload: TSignature) => {
  return await SignatureModel.create(payload);
};

const getAllDB = async (user_id: string) => {
  return await SignatureModel.find({ user_id, isDeleted: false }).sort({ createdAt: -1 });
};

const getSingleDB = async (id: string, user_id: string) => {
  return await SignatureModel.findOne({ _id: id, user_id, isDeleted: false });
};

const updateDB = async (id: string, payload: Partial<TSignature>, user_id: string) => {
  return await SignatureModel.findOneAndUpdate(
    { _id: id, user_id },
    payload,
    { new: true }
  );
};

const deleteDBOne = async (id: string, user_id: string) => {
  return await SignatureModel.findOneAndUpdate(
    { _id: id, user_id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
};

const deleteDB = withBulkDeleteId(deleteDBOne);

export const signatureService = {
  createDB,
  getAllDB,
  getSingleDB,
  updateDB,
  deleteDB,
};
