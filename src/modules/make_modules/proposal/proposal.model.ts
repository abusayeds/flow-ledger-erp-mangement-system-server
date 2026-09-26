import { Schema, model, Types } from "mongoose";
import { proposalStatus, TProposal } from "./proposal.interface";

/** Stored totals include `sub_total` from `calculateInvoice`; not on client-facing `TProposal`. */
type ProposalDocument = TProposal & { sub_total?: number };

const productSchema = new Schema(
  {
    product_id: { type: Types.ObjectId, ref: "Product" },
    product_name: { type: String },
    description: { type: String },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const serviceSchema = new Schema(
  {
    service_id: { type: Types.ObjectId, ref: "Service" },
    service_name: { type: String },
    quantity: { type: Number },
    rate: { type: Number },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    amount: { type: Number },
  },
  { _id: false }
);

const proposalSchema = new Schema<ProposalDocument>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    customer_id: { type: Schema.Types.ObjectId, ref: "User" },
    vendor_id: { type: Schema.Types.ObjectId, ref: "User" },
    warehouse_id: { type: Schema.Types.ObjectId, ref: "Warehouse" },
    proposal_number: { type: String },
    proposal_date: { type: Date },
    due_date: { type: Date },
    discount_before_tax: { type: Number, default: 0 },
    product: [productSchema],
    service: [serviceSchema],
    status: { type: String, enum: proposalStatus, default: "Draft" },
    notes: { type: String },
    deposit: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    shipping_cost: { type: Number, default: 0 },
    inline_discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    sub_total: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    isArchive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ProposalModel = model<ProposalDocument>("Proposal", proposalSchema);
