import { Schema, model } from "mongoose";
import { TPayment } from "./payment.interface";

const paymentSchema = new Schema<TPayment>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      required: [true, "User ID is required"],
      ref: "User",
    },
    customer_id: {
      type: Schema.Types.ObjectId,
      required: [true, "Customer ID is required"],
      ref: "User",
    },
    payment_number: {
      type: String,
      trim: true,
      default: "",
    },
    payment_date: {
      type: Date,
      required: [true, "Payment date is required"],
      default: Date.now,
    },
    payment_type: {
      type: String,
      required: [true, "Payment type is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    internal_notes: {
      type: String,
      default: "",
      trim: true,
    },
    attachments: {
      type: String,
    },
    type: {
      type: String,
      trim: true,
    },
    invoice_id: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isArchive: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const PaymentModel = model<TPayment>("Payment", paymentSchema);
