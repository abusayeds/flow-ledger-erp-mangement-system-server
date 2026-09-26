import httpStatus from "http-status";
import AppError from "../../../errors/AppError";
import { FormModel } from "./form.model";
import { FormResponseModel } from "./formResponse.model";
import { TFormField } from "./form.interface";
import { processConversion } from "./conversion.service";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const urlRe = /^https?:\/\/.+/i;

// Validate a submission (body keyed by field _id) against the form's fields.
const validate = (fields: TFormField[], body: Record<string, unknown>) => {
  const errors: string[] = [];
  let any = false;
  for (const f of fields || []) {
    const key = String(f._id);
    const val = body ? body[key] : undefined;
    const has = val !== undefined && val !== null && String(val).trim() !== "";
    if (has) any = true;
    if (f.required && !has) {
      errors.push(`${f.label} is required`);
      continue;
    }
    if (!has) continue;
    const s = String(val);
    if (f.type === "email" && !emailRe.test(s)) errors.push(`${f.label} must be a valid email`);
    else if (f.type === "number" && isNaN(Number(val))) errors.push(`${f.label} must be a number`);
    else if (f.type === "url" && !urlRe.test(s)) errors.push(`${f.label} must be a valid URL`);
    else if ((f.type === "select" || f.type === "radio") && (f.options?.length || 0) > 0 && !f.options?.includes(s))
      errors.push(`${f.label} must be one of: ${(f.options || []).join(", ")}`);
  }
  return { errors, any };
};

// Public render: only an active, non-deleted form (no internal fields exposed).
const showDB = async (code: string) => {
  const form = await FormModel.findOne({ code, is_active: true, isDeleted: false }).select(
    "name code default_layout fields"
  );
  if (!form) throw new AppError(httpStatus.NOT_FOUND, "Form not found or no longer available");
  return form;
};

const submitDB = async (code: string, body: Record<string, unknown>) => {
  const form = await FormModel.findOne({ code, is_active: true, isDeleted: false });
  if (!form) throw new AppError(httpStatus.NOT_FOUND, "Form not found or no longer available");

  const { errors, any } = validate(form.fields as unknown as TFormField[], body);
  if (errors.length) throw new AppError(httpStatus.BAD_REQUEST, errors.join("; "));
  if (!any) throw new AppError(httpStatus.BAD_REQUEST, "Please fill at least one field");

  const response = await FormResponseModel.create({ form_id: form._id, response_data: body });

  // Auto-convert to the mapped module (best-effort — a conversion failure must not
  // fail the submission), mirroring the Laravel behaviour.
  let converted = false;
  if (form.conversion?.is_active) {
    try {
      const record = await processConversion(form, body);
      converted = Boolean(record);
    } catch {
      converted = false;
    }
  }

  return { message: "Form submitted successfully", response_id: response._id, converted };
};

export const publicFormService = { showDB, submitDB };
