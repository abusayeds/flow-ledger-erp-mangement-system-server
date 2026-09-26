import { Schema, model } from "mongoose";
import { TKnowledge } from "./knowledge.interface";

const knowledgeSchema = new Schema<TKnowledge>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    creator_id: { type: Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: Schema.Types.ObjectId, ref: "SupportKnowledgeCategory" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const KnowledgeModel = model<TKnowledge>("SupportKnowledge", knowledgeSchema);
