import { Schema, model } from "mongoose";
import { TLeadStage } from "./leadStage.interface";

const leadStageSchema = new Schema<TLeadStage>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true, trim: true },
    pipeline_id: { type: Schema.Types.ObjectId, required: true, ref: "CrmPipeline" },
    order: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const LeadStageModel = model<TLeadStage>("CrmLeadStage", leadStageSchema);
