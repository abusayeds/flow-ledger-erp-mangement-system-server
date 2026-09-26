import { Types } from "mongoose";
import queryBuilder from "../../../builder/queryBuilder";
import { TActivities, TRecordActivityInput } from "./activities.interface";
import ActivitiesModel from "./activities.model";
import { recordActivities, recordActivity } from "../../../utils/recordActivity";

const activitiesCreateDB = async (payload: TRecordActivityInput) => {
  await recordActivity(payload);
};

const activitiesCreateManyDB = async (payloads: TRecordActivityInput[]) => {
  await recordActivities(payloads);
};

const getAllActivitiesDB = async (user_id: string, query: Record<string, unknown>) => {
  const baseFilter: Record<string, unknown> = { user_id, isDeleted: false };
  const queryForBuilder = { ...query };

  const entityId = query.entity_id;
  if (entityId !== undefined && entityId !== null && String(entityId).trim()) {
    baseFilter.entity_ids = new Types.ObjectId(String(entityId));
    delete queryForBuilder.entity_id;
  }

  const activityQuery = new queryBuilder(ActivitiesModel.find(baseFilter), queryForBuilder)
    .search(["title", "module", "action"])
    .filter()
    .sort()
    .fields();

  const { totalData } = await activityQuery.paginate(ActivitiesModel.find(baseFilter));
  const data = await activityQuery.modelQuery
    .populate("actor_id", "name email image role")
    .exec();

  const currentPage = Number(query?.page) || 1;
  const limit = Number(query.limit) || 10;
  const pagination = activityQuery.calculatePagination({
    totalData,
    currentPage,
    limit,
  });

  return { data, pagination };
};

const getActivitiesByEntityDB = async (
  user_id: string,
  module: TActivities["module"],
  entity_id: string,
  query: Record<string, unknown> = {}
) =>
  getAllActivitiesDB(user_id, {
    ...query,
    module,
    entity_id,
  });

export const activitiesService = {
  activitiesCreateDB,
  activitiesCreateManyDB,
  getAllActivitiesDB,
  getActivitiesByEntityDB,
};
