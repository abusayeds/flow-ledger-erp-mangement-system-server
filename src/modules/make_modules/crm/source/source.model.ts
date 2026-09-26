import { Schema, model } from "mongoose";
import { TSource } from "./source.interface";

const sourceSchema = new Schema<TSource>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true, trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const SourceModel = model<TSource>("CrmSource", sourceSchema);
