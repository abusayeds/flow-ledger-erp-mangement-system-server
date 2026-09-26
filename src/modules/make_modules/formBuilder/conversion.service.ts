/* eslint-disable @typescript-eslint/no-explicit-any */
// Form-to-module conversion: when a public form is submitted and conversion is
// active, map the response data to a target module's fields and create the record.
// Supported targets are the CRM Lead/Deal (the modules this app has).
import { PipelineModel } from "../crm/pipeline/pipeline.model";
import { LeadStageModel } from "../crm/leadStage/leadStage.model";
import { DealStageModel } from "../crm/dealStage/dealStage.model";
import { LeadModel } from "../crm/lead/lead.model";
import { DealModel } from "../crm/deal/deal.model";

// Modules/fields the conversion UI can map to.
export const getAvailableModules = () => [
  {
    module: "Lead",
    submodules: [
      { name: "Lead", fields: ["name", "email", "subject", "phone", "notes", "date", "pipeline_id", "stage_id"] },
      { name: "Deal", fields: ["name", "price", "phone", "notes", "pipeline_id", "stage_id"] },
    ],
  },
];

// field_mappings value is either a form-field _id (→ take the submitted value) or a static value.
const mapData = (mappings: Record<string, unknown>, responseData: Record<string, unknown>) => {
  const out: Record<string, any> = {};
  for (const [moduleField, val] of Object.entries(mappings || {})) {
    const key = String(val);
    out[moduleField] =
      responseData && Object.prototype.hasOwnProperty.call(responseData, key) ? responseData[key] : val;
  }
  return out;
};

const resolvePipeline = async (user_id: any, given: any) =>
  given || (await PipelineModel.findOne({ user_id, isDeleted: false }).sort({ createdAt: 1 }))?._id;

const createLead = async (user_id: any, m: Record<string, any>) => {
  const pipeline_id = await resolvePipeline(user_id, m.pipeline_id);
  const stage_id =
    m.stage_id ||
    (pipeline_id
      ? (await LeadStageModel.findOne({ user_id, pipeline_id, isDeleted: false }).sort({ order: 1 }))?._id
      : undefined);
  return LeadModel.create({
    user_id,
    creator_id: user_id,
    name: m.name || "Form Lead",
    email: m.email,
    phone: m.phone,
    subject: m.subject,
    notes: m.notes,
    date: m.date,
    pipeline_id,
    stage_id,
  });
};

const createDeal = async (user_id: any, m: Record<string, any>) => {
  const pipeline_id = await resolvePipeline(user_id, m.pipeline_id);
  const stage_id =
    m.stage_id ||
    (pipeline_id
      ? (await DealStageModel.findOne({ user_id, pipeline_id, isDeleted: false }).sort({ order: 1 }))?._id
      : undefined);
  return DealModel.create({
    user_id,
    creator_id: user_id,
    name: m.name || "Form Deal",
    price: Number(m.price) || 0,
    phone: m.phone,
    notes: m.notes,
    pipeline_id,
    stage_id,
    status: "Active",
    is_active: true,
  });
};

// Returns the created record (or null if conversion is off/unsupported).
export const processConversion = async (form: any, responseData: Record<string, unknown>) => {
  const conv = form?.conversion;
  if (!conv || !conv.is_active || !conv.module_name) return null;

  const mapped = mapData(conv.field_mappings || {}, responseData);
  const user_id = form.user_id;

  if (conv.module_name === "Lead") {
    if (conv.submodule_name === "Deal") return createDeal(user_id, mapped);
    return createLead(user_id, mapped);
  }
  return null;
};
