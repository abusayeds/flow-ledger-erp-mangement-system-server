import { Schema, model } from "mongoose";
import { TLead } from "./lead.interface";
import { taskSchema, callSchema, emailSchema, discussionSchema, fileSchema } from "../shared/crm.subSchemas";

const leadSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    creator_id: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, trim: true },
    email: { type: String },
    phone: { type: String },
    subject: { type: String },
    notes: { type: String },
    date: { type: Date },
    pipeline_id: { type: Schema.Types.ObjectId, ref: "CrmPipeline" },
    stage_id: { type: Schema.Types.ObjectId, ref: "CrmLeadStage" },
    order: { type: Number, default: 0 },
    sources: [{ type: Schema.Types.ObjectId, ref: "CrmSource" }],
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    labels: [{ type: Schema.Types.ObjectId, ref: "CrmLabel" }],
    assigned_users: [{ type: Schema.Types.ObjectId, ref: "User" }],
    tasks: [taskSchema],
    calls: [callSchema],
    emails: [emailSchema],
    discussions: [discussionSchema],
    files: [fileSchema],
    is_active: { type: Boolean, default: true },
    is_converted: { type: Boolean, default: false },
    converted_deal_id: { type: Schema.Types.ObjectId, ref: "CrmDeal" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const LeadModel = model<TLead>("CrmLead", leadSchema);
