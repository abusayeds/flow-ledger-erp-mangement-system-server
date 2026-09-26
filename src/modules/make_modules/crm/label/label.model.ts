import { Schema, model } from "mongoose";
import { TLabel } from "./label.interface";

const labelSchema = new Schema<TLabel>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: "#FF6B6B" },
    pipeline_id: { type: Schema.Types.ObjectId, ref: "CrmPipeline" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const LabelModel = model<TLabel>("CrmLabel", labelSchema);
