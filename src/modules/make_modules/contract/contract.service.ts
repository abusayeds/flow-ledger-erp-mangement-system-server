import { Types } from "mongoose";
import { ContractModel } from "./contract.model";

const uid = (id: string) => new Types.ObjectId(id);

const createDB = async (userId: string, body: Record<string, unknown>) => {
  const doc = await ContractModel.create({ ...body, user_id: uid(userId) });
  return doc.toObject();
};

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = {
    user_id: uid(userId),
    isDeleted: { $ne: true },
  };
  const term = (query.searchTerm as string) ?? "";
  if (term.trim()) {
    const rx = new RegExp(term.trim(), "i");
    filter.$or = [
      { subject: rx },
      { contract_number: rx },
      { party_name: rx },
      { type: rx },
    ];
  }
  if (query.status) filter.status = query.status;
  return ContractModel.find(filter).sort({ createdAt: -1 }).lean();
};

const getSingleDB = async (userId: string, id: string) =>
  ContractModel.findOne({ _id: id, user_id: uid(userId) }).lean();

const updateDB = async (
  userId: string,
  id: string,
  body: Record<string, unknown>
) =>
  ContractModel.findOneAndUpdate(
    { _id: id, user_id: uid(userId) },
    { $set: body },
    { new: true }
  ).lean();

const deleteDB = async (userId: string, id: string) =>
  ContractModel.findOneAndUpdate(
    { _id: id, user_id: uid(userId) },
    { $set: { isDeleted: true } },
    { new: true }
  ).lean();

export const contractService = {
  createDB,
  getAllDB,
  getSingleDB,
  updateDB,
  deleteDB,
};
