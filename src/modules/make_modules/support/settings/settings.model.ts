import { Schema, model } from "mongoose";
import { TSupportSetting } from "./settings.interface";

const supportSettingSchema = new Schema<TSupportSetting>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    key: { type: String, required: true },
    value: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

supportSettingSchema.index({ user_id: 1, key: 1 }, { unique: true });

export const SupportSettingModel = model<TSupportSetting>("SupportSetting", supportSettingSchema);
