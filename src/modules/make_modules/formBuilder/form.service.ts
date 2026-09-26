import { randomUUID } from "crypto";
import httpStatus from "http-status";
import AppError from "../../../errors/AppError";
import queryBuilder from "../../../builder/queryBuilder";
import { FormModel } from "./form.model";
import { FormResponseModel } from "./formResponse.model";
import { TForm, TFormConversion, TFormField } from "./form.interface";
import { getAvailableModules } from "./conversion.service";
import { withBulkDeleteId, runBulkDelete, parseDeleteIdsFromParam } from "../../../utils/bulkDelete";

const ensureForm = async (id: string, user_id: string) => {
  const form = await FormModel.findOne({ _id: id, user_id, isDeleted: false });
  if (!form) throw new AppError(httpStatus.NOT_FOUND, "Form not found");
  return form;
};

const createDB = async (payload: TForm) => {
  payload.code = randomUUID();
  return FormModel.create(payload);
};

const getAllDB = async (user_id: string, query: Record<string, unknown> = {}) => {
  const base = { user_id, isDeleted: false };
  const qb = new queryBuilder(FormModel.find(base), query)
    .search(["name", "code"] as never)
    .filter()
    .sort()
    .fields();
  const { totalData } = await qb.paginate(FormModel.find(base));
  const data = await qb.modelQuery.exec();
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query?.limit) || 10;
  const pagination = qb.calculatePagination({ totalData, currentPage, limit });

  // Attach live response counts for list UI.
  const ids = data.map((d) => d._id);
  const counts = await FormResponseModel.aggregate([
    { $match: { form_id: { $in: ids }, isDeleted: { $ne: true } } },
    { $group: { _id: "$form_id", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count as number]));
  const rows = data.map((d) => {
    const plain = d.toObject ? d.toObject() : d;
    return { ...plain, response_count: countMap.get(String(d._id)) || 0 };
  });

  return { data: rows, pagination };
};

const getSingleDB = async (id: string, user_id: string) => ensureForm(id, user_id);

const updateDB = async (id: string, payload: Partial<TForm>, user_id: string) => {
  const data: Record<string, unknown> = {};
  if (payload.name !== undefined) data.name = payload.name;
  if (payload.default_layout !== undefined) data.default_layout = payload.default_layout;
  if (payload.is_active !== undefined) data.is_active = payload.is_active;
  return FormModel.findOneAndUpdate({ _id: id, user_id }, data, { new: true, runValidators: true });
};

const deleteDBOne = async (id: string, user_id: string) => {
  const deleted = await FormModel.findOneAndUpdate({ _id: id, user_id, isDeleted: false }, { isDeleted: true }, { new: true });
  if (!deleted) throw new AppError(httpStatus.NOT_FOUND, "Form not found");
  await FormResponseModel.updateMany({ form_id: id }, { isDeleted: true });
  return deleted;
};

// Bulk-replace the whole field list (the builder saves all fields together).
const updateFieldsDB = async (id: string, user_id: string, fields: TFormField[]) =>
  FormModel.findOneAndUpdate({ _id: id, user_id }, { $set: { fields: fields || [] } }, { new: true, runValidators: true });

const deleteFieldDBOne = async (id: string, user_id: string, fieldId: string) =>
  FormModel.findOneAndUpdate({ _id: id, user_id }, { $pull: { fields: { _id: fieldId } } }, { new: true });

const responsesDB = async (formId: string, user_id: string, query: Record<string, unknown> = {}) => {
  await ensureForm(formId, user_id);
  const base = { form_id: formId, isDeleted: { $ne: true } };
  const qb = new queryBuilder(FormResponseModel.find(base), query).filter().sort().fields();
  const { totalData } = await qb.paginate(FormResponseModel.find(base));
  const data = await qb.modelQuery.exec();
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query?.limit) || 10;
  const pagination = qb.calculatePagination({ totalData, currentPage, limit });
  return { data, pagination };
};

const singleResponseDB = async (formId: string, responseId: string, user_id: string) => {
  await ensureForm(formId, user_id);
  return FormResponseModel.findOne({ _id: responseId, form_id: formId, isDeleted: false });
};

const deleteResponseDBOne = async (formId: string, responseId: string, user_id: string) => {
  await ensureForm(formId, user_id);
  return FormResponseModel.findOneAndUpdate({ _id: responseId, form_id: formId, isDeleted: false }, { isDeleted: true }, { new: true });
};

const getConversionDB = async (id: string, user_id: string) => {
  const form = await ensureForm(id, user_id);
  return { conversion: form.conversion || {}, available_modules: getAvailableModules() };
};

const updateConversionDB = async (id: string, user_id: string, payload: TFormConversion) => {
  const conversion = {
    module_name: payload.module_name,
    submodule_name: payload.submodule_name,
    is_active: payload.is_active ?? false,
    field_mappings: payload.field_mappings || {}
  };
  return FormModel.findOneAndUpdate({ _id: id, user_id }, { $set: { conversion } }, { new: true });
};

const deleteDB = withBulkDeleteId(deleteDBOne);

const deleteFieldDB = async (id: string, user_id: string, fieldId: string) =>
  runBulkDelete(parseDeleteIdsFromParam(fieldId), (oneFieldId) => deleteFieldDBOne(id, user_id, oneFieldId));

const deleteResponseDB = async (formId: string, responseId: string, user_id: string) =>
  runBulkDelete(parseDeleteIdsFromParam(responseId), (oneId) => deleteResponseDBOne(formId, oneId, user_id));

export const formService = {
  createDB, getAllDB, getSingleDB, updateDB, deleteDB, updateFieldsDB, deleteFieldDB,
  responsesDB, singleResponseDB, deleteResponseDB, getConversionDB, updateConversionDB,
  getAvailableModules,
};
