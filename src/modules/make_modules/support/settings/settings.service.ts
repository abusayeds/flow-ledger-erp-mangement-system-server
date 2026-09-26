import { SupportSettingModel } from "./settings.model";

const getAllDB = async (user_id: string) => {
  const rows = await SupportSettingModel.find({ user_id });
  const out: Record<string, unknown> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
};

const getOneDB = async (user_id: string, key: string) => {
  const row = await SupportSettingModel.findOne({ user_id, key });
  return { key, value: row ? row.value : null };
};

// Upsert any number of key/value pairs at once: body = { key1: value1, key2: value2 }.
const updateDB = async (user_id: string, data: Record<string, unknown>) => {
  const ops = Object.entries(data || {}).map(([key, value]) => ({
    updateOne: { filter: { user_id, key }, update: { $set: { value } }, upsert: true }
  }));
  if (ops.length) await SupportSettingModel.bulkWrite(ops);
  return getAllDB(user_id);
};

export const supportSettingService = { getAllDB, getOneDB, updateDB };
