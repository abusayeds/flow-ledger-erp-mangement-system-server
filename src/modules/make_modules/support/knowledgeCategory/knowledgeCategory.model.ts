import { Schema, model } from "mongoose";
import { TKnowledgeCategory } from "./knowledgeCategory.interface";

const knowledgeCategorySchema = new Schema<TKnowledgeCategory>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    creator_id: { type: Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true, trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const KnowledgeCategoryModel = model<TKnowledgeCategory>("SupportKnowledgeCategory", knowledgeCategorySchema);
