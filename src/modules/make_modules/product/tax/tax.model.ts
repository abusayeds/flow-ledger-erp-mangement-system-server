import { Schema, model } from "mongoose";
import { TAX_TYPES, TTax } from "./tax.interface";

const taxSchema = new Schema<TTax>(
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
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: TAX_TYPES,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

taxSchema.index({ user_id: 1, type: 1 });

export const TaxModel = model<TTax>("Tax", taxSchema);
