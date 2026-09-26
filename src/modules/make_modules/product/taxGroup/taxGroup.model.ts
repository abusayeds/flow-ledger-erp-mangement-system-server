import { Schema, model } from "mongoose";
import {
  TAX_BASE_AMOUNTS,
  TAX_GROUP_STATUS,
  TTaxGroup,
} from "./taxGroup.interface";

const taxGroupMemberSchema = new Schema(
  {
    tax_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Tax",
    },
    base_amount: {
      type: String,
      enum: TAX_BASE_AMOUNTS,
      default: "net_amount",
    },
  },
  { _id: false }
);

const taxGroupSchema = new Schema<TTaxGroup>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    members: {
      type: [taxGroupMemberSchema],
      default: [],
    },
    apply_to_service: {
      type: Boolean,
      default: true,
    },
    apply_to_product: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: TAX_GROUP_STATUS,
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

taxGroupSchema.index({ user_id: 1, status: 1 });

export const TaxGroupModel = model<TTaxGroup>("TaxGroup", taxGroupSchema);
