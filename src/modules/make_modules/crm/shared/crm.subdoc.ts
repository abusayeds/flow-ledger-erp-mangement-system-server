/* eslint-disable @typescript-eslint/no-explicit-any */
// Generic helpers for managing embedded sub-arrays and ref-arrays on a company-scoped doc.
// Every op is scoped by { _id, user_id, isDeleted:false } so a company only touches its own records.

const scope = (id: string, user_id: string) => ({ _id: id, user_id });

// Push an embedded sub-document (task/call/email/discussion/file).
export const pushSub = (Model: any, id: string, user_id: string, field: string, item: any) =>
  Model.findOneAndUpdate(scope(id, user_id), { $push: { [field]: item } }, { new: true });

// Update a single embedded sub-document by its _id.
export const updateSub = (Model: any, id: string, user_id: string, field: string, subId: string, data: any) => {
  const set: Record<string, unknown> = {};
  for (const k of Object.keys(data || {})) set[`${field}.$[el].${k}`] = data[k];
  return Model.findOneAndUpdate(scope(id, user_id), { $set: set }, { new: true, arrayFilters: [{ "el._id": subId }] });
};

// Remove an embedded sub-document by its _id.
export const pullSub = (Model: any, id: string, user_id: string, field: string, subId: string) =>
  Model.findOneAndUpdate(scope(id, user_id), { $pull: { [field]: { _id: subId } } }, { new: true });

// Add a reference (user/product/source/label/client) without duplicates.
export const addRef = (Model: any, id: string, user_id: string, field: string, value: any) =>
  Model.findOneAndUpdate(scope(id, user_id), { $addToSet: { [field]: value } }, { new: true });

// Remove a reference.
export const removeRef = (Model: any, id: string, user_id: string, field: string, value: any) =>
  Model.findOneAndUpdate(scope(id, user_id), { $pull: { [field]: value } }, { new: true });

// Replace a whole ref-array (e.g. set labels).
export const setRefs = (Model: any, id: string, user_id: string, field: string, values: any[]) =>
  Model.findOneAndUpdate(scope(id, user_id), { $set: { [field]: values || [] } }, { new: true });
