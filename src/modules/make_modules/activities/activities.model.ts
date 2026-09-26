import { Schema, model } from "mongoose";
import { ActivityAction, TActivities } from "./activities.interface";
import { ACTIVITY_MODULE_VALUES } from "../../../utils/activityModules";

const activitiesSchema = new Schema<TActivities>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    actor_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    module: {
      type: String,
      enum: ACTIVITY_MODULE_VALUES,
      required: true,
      index: true,
    },
    entity_ids: {
      type: [{ type: Schema.Types.ObjectId }],
      required: true,
      default: [],
    },
    action: {
      type: String,
      enum: Object.values(ActivityAction),
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    isArchive: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

activitiesSchema.index({ user_id: 1, module: 1, entity_ids: 1, createdAt: -1 });
activitiesSchema.index({ user_id: 1, createdAt: -1 });

const ActivitiesModel = model<TActivities>("Activities", activitiesSchema);

export default ActivitiesModel;
