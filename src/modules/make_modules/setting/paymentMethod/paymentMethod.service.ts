import { TPaymentMethod } from "./paymentMethod.interface";
import { PaymentMethodModel } from "./paymentMethod.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const createDB = async (payload: TPaymentMethod) => {
  return await PaymentMethodModel.create(payload);
};

const getAllDB = async (user_id: string) => {
  return await PaymentMethodModel.find({ user_id, isDeleted: false }).select("name logo").sort({
    sort_order: 1,
    createdAt: -1,
  });
};

const getSingleDB = async (id: string, user_id: string) => {
  return await PaymentMethodModel.findOne({ _id: id, user_id, isDeleted: false });
};

const updateDB = async (id: string, payload: Partial<TPaymentMethod>, user_id: string) => {
  return await PaymentMethodModel.findOneAndUpdate(
    { _id: id, user_id },
    payload,
    { new: true }
  );
};

const deleteDBOne = async (id: string, user_id: string) => {
  return await PaymentMethodModel.findOneAndUpdate(
    { _id: id, user_id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
};

const deleteDB = withBulkDeleteId(deleteDBOne);

export const paymentMethodService = {
  createDB,
  getAllDB,
  getSingleDB,
  updateDB,
  deleteDB,
};
