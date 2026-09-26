import { Schema } from "mongoose";

// Shared enums + embedded sub-schemas reused by both Lead and Deal documents.
export const crmTaskPriority = ["Low", "Medium", "High"] as const;
export const crmTaskStatus = ["On Going", "Completed"] as const;
export const crmCallType = ["inbound", "outbound"] as const;
export const crmDealStatus = ["Active", "Won", "Lost", "Inactive"] as const;

export const taskSchema = new Schema(
  {
    name: { type: String, required: true },
    date: { type: String },
    time: { type: String },
    priority: { type: String, enum: crmTaskPriority, default: "Medium" },
    status: { type: String, enum: crmTaskStatus, default: "On Going" },
  },
  { timestamps: true }
);

export const callSchema = new Schema(
  {
    subject: { type: String },
    call_type: { type: String, enum: crmCallType, default: "outbound" },
    duration: { type: String },
    description: { type: String },
    call_result: { type: String },
    user_id: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const emailSchema = new Schema(
  {
    to: { type: String },
    subject: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

export const discussionSchema = new Schema(
  {
    comment: { type: String, required: true },
    created_by: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const fileSchema = new Schema(
  {
    file_name: { type: String },
    file_path: { type: String },
  },
  { timestamps: true }
);
