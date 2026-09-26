import { Schema, model } from "mongoose";
import { TPipeline } from "./pipeline.interface";

const pipelineSchema = new Schema<TPipeline>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true, trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const PipelineModel = model<TPipeline>("CrmPipeline", pipelineSchema);
