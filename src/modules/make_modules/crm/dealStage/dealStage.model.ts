import { Schema, model } from "mongoose";
import { TDealStage } from "./dealStage.interface";

const dealStageSchema = new Schema<TDealStage>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true, trim: true },
    pipeline_id: { type: Schema.Types.ObjectId, required: true, ref: "CrmPipeline" },
    order: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const DealStageModel = model<TDealStage>("CrmDealStage", dealStageSchema);
