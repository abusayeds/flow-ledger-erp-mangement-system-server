import { Schema, model } from "mongoose";
import { TFormResponse } from "./form.interface";

const formResponseSchema = new Schema<TFormResponse>(
  {
    form_id: { type: Schema.Types.ObjectId, required: true, ref: "FormBuilderForm", index: true },
    // { fieldId: value } — keyed by the form field's _id.
    response_data: { type: Schema.Types.Mixed, default: {} },
    creator_id: { type: Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const FormResponseModel = model<TFormResponse>("FormBuilderResponse", formResponseSchema);
