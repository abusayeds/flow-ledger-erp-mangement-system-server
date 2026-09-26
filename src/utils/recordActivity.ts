import { Types } from "mongoose";
import ActivitiesModel from "../modules/make_modules/activities/activities.model";
import {
  ActivityAction,
  TRecordActivityInput,
} from "../modules/make_modules/activities/activities.interface";

const toObjectIds = (ids: (Types.ObjectId | string)[]): Types.ObjectId[] =>
  ids
    .filter((id) => id !== undefined && id !== null && String(id).trim())
    .map((id) => new Types.ObjectId(id));

const buildDoc = (input: TRecordActivityInput) => {
  const entity_ids = toObjectIds(input.entity_ids);
  if (entity_ids.length === 0) {
    throw new Error("entity_ids is required");
  }
  return {
    user_id: new Types.ObjectId(input.user_id),
    actor_id: new Types.ObjectId(input.actor_id ?? input.user_id),
    module: input.module,
    entity_ids,
    action: input.action,
    title: input.title.trim(),
    metadata: input.metadata,
  };
};

/** Log one activity for one or more linked records (same module + action). */
export const recordActivity = async (input: TRecordActivityInput): Promise<void> => {
  try {
    await ActivitiesModel.create(buildDoc(input));
  } catch (error) {
    console.error("Activity log failed:", error);
  }
};

/** Log multiple activities in one request (e.g. payment + invoice update). */
export const recordActivities = async (inputs: TRecordActivityInput[]): Promise<void> => {
  if (!inputs.length) return;
  try {
    const docs = inputs.map(buildDoc);
    await ActivitiesModel.insertMany(docs);
  } catch (error) {
    console.error("Activity log failed:", error);
  }
};

export const mapLegacyActivityType = (type: string): ActivityAction => {
  const key = type.trim().toLowerCase();
  if (key === "created") return ActivityAction.created;
  if (key === "updated") return ActivityAction.updated;
  if (key === "archived" || key === "deleted") return ActivityAction.archived;
  if (key === "draft") return ActivityAction.draft;
  if (key === "sent") return ActivityAction.sent;
  if (key === "invoiced") return ActivityAction.invoiced;
  return ActivityAction.updated;
};
