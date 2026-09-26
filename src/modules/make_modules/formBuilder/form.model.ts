import { Schema, model } from "mongoose";
import { TForm, formFieldTypes, formLayouts } from "./form.interface";

// Each field is an embedded sub-document (keeps its own _id, which is the key used
// in a response's response_data and in conversion field_mappings).
const fieldSchema = new Schema({
  label: { type: String, required: true },
  type: { type: String, enum: formFieldTypes, default: "text" },
  required: { type: Boolean, default: false },
  placeholder: { type: String },
  options: [{ type: String }],
  order: { type: Number, default: 0 },
});

// One-to-one conversion config embedded on the form.
const conversionSchema = new Schema(
  {
    module_name: { type: String },
    submodule_name: { type: String },
    is_active: { type: Boolean, default: false },
    field_mappings: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const formSchema = new Schema<TForm>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    creator_id: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, index: true },
    is_active: { type: Boolean, default: true },
    default_layout: { type: String, enum: formLayouts, default: "single" },
    fields: [fieldSchema],
    conversion: { type: conversionSchema, default: () => ({}) },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const FormModel = model<TForm>("FormBuilderForm", formSchema);
