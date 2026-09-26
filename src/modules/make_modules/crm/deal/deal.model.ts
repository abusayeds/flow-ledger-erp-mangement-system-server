import { Schema, model } from "mongoose";
import { TDeal } from "./deal.interface";
import {
  taskSchema,
  callSchema,
  emailSchema,
  discussionSchema,
  fileSchema,
  crmDealStatus,
} from "../shared/crm.subSchemas";

const dealSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    creator_id: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, trim: true },
    price: { type: Number, default: 0 },
    phone: { type: String },
    notes: { type: String },
    pipeline_id: { type: Schema.Types.ObjectId, ref: "CrmPipeline" },
    stage_id: { type: Schema.Types.ObjectId, ref: "CrmDealStage" },
    order: { type: Number, default: 0 },
    status: { type: String, enum: crmDealStatus, default: "Active" },
    sources: [{ type: Schema.Types.ObjectId, ref: "CrmSource" }],
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    labels: [{ type: Schema.Types.ObjectId, ref: "CrmLabel" }],
    assigned_users: [{ type: Schema.Types.ObjectId, ref: "User" }],
    clients: [{ type: Schema.Types.ObjectId, ref: "User" }],
    tasks: [taskSchema],
    calls: [callSchema],
    emails: [emailSchema],
    discussions: [discussionSchema],
    files: [fileSchema],
    is_active: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const DealModel = model<TDeal>("CrmDeal", dealSchema);
