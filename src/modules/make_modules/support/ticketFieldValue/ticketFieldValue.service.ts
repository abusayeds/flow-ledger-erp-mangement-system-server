import { Types } from "mongoose";
import { TicketFieldValueModel } from "./ticketFieldValue.model";

const saveFieldData = async (
  companyId: string,
  recordId: Types.ObjectId,
  fields: Record<string, unknown> | undefined,
) => {
  if (!fields || !Object.keys(fields).length) return;
  const ops = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([fieldId, value]) => ({
      updateOne: {
        filter: { user_id: companyId, record_id: recordId, field_id: fieldId },
        update: { $set: { value } },
        upsert: true,
      },
    }));
  if (ops.length) await TicketFieldValueModel.bulkWrite(ops);
};

const getFieldData = async (companyId: string, recordId: Types.ObjectId) => {
  const rows = await TicketFieldValueModel.find({ user_id: companyId, record_id: recordId });
  const out: Record<string, unknown> = {};
  for (const r of rows) out[String(r.field_id)] = r.value;
  return out;
};

const removeFieldData = async (companyId: string, recordId: Types.ObjectId) => {
  await TicketFieldValueModel.deleteMany({ user_id: companyId, record_id: recordId });
};

export const ticketFieldValueService = { saveFieldData, getFieldData, removeFieldData };
