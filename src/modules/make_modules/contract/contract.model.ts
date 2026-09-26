import { Schema, model } from "mongoose";
import { TContract, contractStatus } from "./contract.interface";

const contractSchema = new Schema<TContract>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contract_number: { type: String, trim: true },
    subject: { type: String, trim: true },
    party_name: { type: String, trim: true },
    value: { type: Number, default: 0 },
    type: { type: String },
    start_date: { type: Date },
    end_date: { type: Date },
    status: { type: String, enum: contractStatus, default: "Draft" },
    description: { type: String },
    duration: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ContractModel = model<TContract>("Contract", contractSchema);
