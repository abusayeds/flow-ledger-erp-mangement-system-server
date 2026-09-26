import { TSalesperson } from "./salesperson.interface";
import { SalespersonModel } from "./salesperson.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const createDB = async (payload: TSalesperson) => {
  return await SalespersonModel.create(payload);
};

const getAllDB = async (
  user_id: string,
  opts?: { searchTerm?: string; status?: string }
) => {
  const filter: Record<string, unknown> = { user_id, isDeleted: false };
  const status = opts?.status?.trim();
  if (status && status !== "All") filter.status = status;
  const q = opts?.searchTerm?.trim();
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }
  return await SalespersonModel.find(filter).sort({ createdAt: -1 });
};

const getSingleDB = async (id: string, user_id: string) => {
  return await SalespersonModel.findOne({ _id: id, user_id, isDeleted: false });
};

const updateDB = async (id: string, payload: Partial<TSalesperson>, user_id: string) => {
  return await SalespersonModel.findOneAndUpdate(
    { _id: id, user_id },
    payload,
    { new: true }
  );
};

const deleteDBOne = async (id: string, user_id: string) => {
  return await SalespersonModel.findOneAndUpdate(
    { _id: id, user_id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
};

const deleteDB = withBulkDeleteId(deleteDBOne);

export const salespersonService = {
  createDB,
  getAllDB,
  getSingleDB,
  updateDB,
  deleteDB,
};
