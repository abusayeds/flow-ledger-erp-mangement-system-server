import { Types } from "mongoose";
import { TSettingType } from "./app.setting.interface";
import { SettingModel } from "./app.setting.model";
import { setting_seed_data } from "../../../utils/seed/seed.setting";


// ── Valid subTypes per type ──────────────────────────────

const DOC_SUB_TYPES = ["field_visibility", "general", "columns", "summary", "print_email", "payment"];

const SUB_TYPE_MAP: Partial<Record<TSettingType, string[]>> = {
  invoice:          DOC_SUB_TYPES,
  proforma_invoice: DOC_SUB_TYPES,
  sales_receipt:    DOC_SUB_TYPES,
  estimate:         DOC_SUB_TYPES,
  delivery_challan: DOC_SUB_TYPES,
  purchase_order:   DOC_SUB_TYPES,
  bill:             DOC_SUB_TYPES,
  credit_note:      DOC_SUB_TYPES,
  debit_note:       DOC_SUB_TYPES,
  product:          ["field_visibility", "general", "stock"],
  time_log:         ["columns", "summary"],
  // flat types — no subType
  general:          [],
  modules:          [],
  currency_format:  [],
  printer:          [],
  security:         [],
  titles:           [],
  whatsApp:         [],
  notification:     [],
  expense:          [],
  service:          [],
};

// ── Validation helper ────────────────────────────────────

const validateTypeAndSubType = (
  type: TSettingType,
  subType?: string
): void => {
  const validSubTypes = SUB_TYPE_MAP[type];

  if (validSubTypes === undefined) {
    throw new Error(`Invalid type: '${type}'`);
  }

  if (subType) {
    if (validSubTypes.length === 0) {
      throw new Error(`Type '${type}' does not support subType`);
    }
    if (!validSubTypes.includes(subType)) {
      throw new Error(
        `Invalid subType '${subType}' for type '${type}'. Valid: ${validSubTypes.join(", ")}`
      );
    }
  }
};

// ── LIST TYPES ───────────────────────────────────────────
// Returns every valid `type` and its allowed `subType`s so the client can
// discover what to pass to GET /setting/app?type=...&subType=...
const getSettingTypesService = () => {
  return (Object.entries(SUB_TYPE_MAP) as [TSettingType, string[]][]).map(
    ([type, subTypes]) => ({
      type,
      subTypes: subTypes ?? [],
      hasSubType: (subTypes?.length ?? 0) > 0,
    })
  );
};

// ── GET ──────────────────────────────────────────────────

 const getSettingService = async (
  user_id: Types.ObjectId,
  type?: TSettingType,
  subType?: string
) => {
    
  if (subType && type) {
    validateTypeAndSubType(type, subType);
    const data = await SettingModel.findOne({ user_id })
      .select(`${type}.${subType}`)
      .lean();
    if (!data) return null;
    return { [subType]: (data[type] as unknown as Record<string, unknown>)?.[subType] };
  }

  if(type) {
    const data = await SettingModel.findOne({ user_id })
      .select(type)
      .lean();
      if (!data) return null;
      return data[type];
  } else {
    const data = await SettingModel.findOne({ user_id }).lean()
    return data;
  }
};

// ── UPDATE ───────────────────────────────────────────────

 const updateSettingService = async (
  user_id: Types.ObjectId,
  type: TSettingType,
  payload: Record<string, unknown>,
  subType?: string
) => {
  validateTypeAndSubType(type, subType);

  const dotNotationUpdate: Record<string, unknown> = {};
  // `type`/`subType` are routing discriminators, not data — never persist them
  // (matters for Mixed maps like `titles`, which would otherwise store them).
  const isMeta = (k: string) => k === "type" || k === "subType";

  if (subType) {
    // ?type=invoice&subType=general
    // payload: { due_date: true, shipping_address: false }
    // → "invoice.general.due_date": true
    for (const [key, value] of Object.entries(payload)) {
      if (isMeta(key)) continue;
      dotNotationUpdate[`${type}.${subType}.${key}`] = value;
    }
  } else {
    // ?type=invoice (subType)
    // payload: { "general.due_date": true }flat module payload
    for (const [key, value] of Object.entries(payload)) {
      if (isMeta(key)) continue;
      dotNotationUpdate[`${type}.${key}`] = value;
    }
  }

  const updated = await SettingModel.findOneAndUpdate(
    { user_id },
    { $set: dotNotationUpdate },
    { new: true, upsert: true, runValidators: true }
  ).lean();

  if (!updated) return null;
  if (subType) {
    return {
      [type]: {
        [subType]: (updated[type] as unknown as Record<string, unknown>)?.[subType]
      }
    };
  }

  return { [type]: updated[type] };
};

// ── RESET ────────────────────────────────────────────────
// Reset back to the seed defaults. Scope:
//   - type + subType  → reset just that section (e.g. invoice.field_visibility)
//   - type only       → reset the whole type (e.g. invoice)
//   - nothing         → reset every section to default
const resetSettingService = async (
  user_id: Types.ObjectId,
  type?: TSettingType,
  subType?: string
) => {
  const seed = setting_seed_data as Record<string, unknown>;
  const setObj: Record<string, unknown> = {};

  if (type) {
    validateTypeAndSubType(type, subType);
    if (subType) {
      setObj[`${type}.${subType}`] = (seed[type] as Record<string, unknown>)?.[subType];
    } else {
      setObj[type] = seed[type];
    }
  } else {
    // Whole reset — restore every default section.
    Object.assign(setObj, seed);
  }

  const updated = await SettingModel.findOneAndUpdate(
    { user_id },
    { $set: setObj },
    { new: true, upsert: true, runValidators: true }
  ).lean();

  if (!updated) return null;
  if (type && subType) {
    return { [type]: { [subType]: (updated[type] as unknown as Record<string, unknown>)?.[subType] } };
  }
  if (type) return { [type]: updated[type] };
  return updated;
};

export const settingService =  {
getSettingService , updateSettingService , getSettingTypesService , resetSettingService
}