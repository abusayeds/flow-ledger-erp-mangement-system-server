import { Types } from "mongoose";

export const formFieldTypes = [
  "text", "email", "number", "tel", "url", "password", "textarea",
  "select", "radio", "checkbox", "date", "time",
] as const;

export const formLayouts = ["single", "two-column", "card"] as const;

export type TFormField = {
  _id?: Types.ObjectId;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  order?: number;
};

export type TFormConversion = {
  module_name?: string;
  submodule_name?: string;
  is_active?: boolean;
  field_mappings?: Record<string, unknown>;
};

export type TForm = {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  creator_id?: Types.ObjectId;
  name: string;
  code: string;
  is_active?: boolean;
  default_layout?: string;
  fields?: TFormField[];
  conversion?: TFormConversion;
  isDeleted?: boolean;
  createdAt?: Date;
};

export type TFormResponse = {
  _id?: Types.ObjectId;
  form_id: Types.ObjectId;
  response_data?: Record<string, unknown>;
  creator_id?: Types.ObjectId;
  isDeleted?: boolean;
  createdAt?: Date;
};
