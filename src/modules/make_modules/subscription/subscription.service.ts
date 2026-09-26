import { TSubscription } from "./subscription.interface";
import { SubscriptionModel } from "./subscription.model";
import { withBulkDeleteId } from "../../../utils/bulkDelete";

const createSubscriptionDB = async (payload: TSubscription) => {
  const subscription = await SubscriptionModel.create(payload);
  return subscription;
};

const getAllSubscriptionsDB = async () => {
  const subscriptions = await SubscriptionModel.find();
  return subscriptions;
};

const getSingleSubscriptionDB = async (id: string) => {
  const subscription = await SubscriptionModel.findById(id);
  return subscription;
};

const updateSubscriptionDB = async (
  id: string,
  payload: Partial<TSubscription>
) => {
  const subscription = await SubscriptionModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true
  });
  return subscription;
};

const deleteSubscriptionDBOne = async (id: string) => {
  const subscription = await SubscriptionModel.findByIdAndDelete(id);
  return subscription;
};

const deleteSubscriptionDB = withBulkDeleteId(deleteSubscriptionDBOne);

export const subscriptionService = {
  createSubscriptionDB,
  getAllSubscriptionsDB,
  getSingleSubscriptionDB,
  updateSubscriptionDB,
  deleteSubscriptionDB,
};