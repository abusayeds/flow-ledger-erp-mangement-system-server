import { Schema, model } from "mongoose";
import { TService } from "./service.interface";


const serviceSchema = new Schema<TService>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    serviceName: { type: String, required: true, trim: true },
    // unitType is optional: the create form has a free-text unit field the user
    // may leave blank. Requiring it here rejected otherwise-valid services with
    // a Mongoose validation error.
    unitType: { type: String, default: '' },
    quantity: { type: Number, required: true, default: 0 },
    rate: { type: Number, required: true, default: 0 },

    taxes: [{ type: String }],

    // No enum: the app supports many currencies (whatever the company uses), and
    // pinning it to four values rejected valid ones (e.g. GBP) with a validation
    // error. Defaults to BDT when the client sends nothing.
    currency: {
      type: String,
      default: "BDT",
    },

    description: { type: String },

    serviceStock: { type: Boolean, default: false },
    sac: { type: Boolean, default: false },
    productStock: { type: Boolean, default: false },
    hsn: { type: Boolean, default: false },

    isArchive: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const ServiceModel = model<TService>("Service", serviceSchema);