import { SupportSettingModel } from "../settings/settings.model";

const BRAND_KEYS = ["logo_dark", "favicon", "title_text", "footer_text"] as const;

const getBrandDB = async (user_id: string) => {
  const rows = await SupportSettingModel.find({ user_id, key: { $in: [...BRAND_KEYS] } });
  const out: Record<string, unknown> = {};
  for (const r of rows) out[r.key] = r.value;
  return {
    logo_dark: out.logo_dark ?? "logo.png",
    favicon: out.favicon ?? "favicon.png",
    titleText: out.title_text ?? "Support Ticket System",
    footerText: out.footer_text ?? `© ${new Date().getFullYear()} Support System. All rights reserved.`,
  };
};

const updateBrandDB = async (user_id: string, body: Record<string, unknown>) => {
  const map: Record<string, unknown> = {};
  if (body.logo_dark !== undefined) map.logo_dark = body.logo_dark;
  if (body.favicon !== undefined) map.favicon = body.favicon;
  if (body.titleText !== undefined) map.title_text = body.titleText;
  if (body.footerText !== undefined) map.footer_text = body.footerText;
  const ops = Object.entries(map).map(([key, value]) => ({
    updateOne: { filter: { user_id, key }, update: { $set: { value } }, upsert: true }
  }));
  if (ops.length) await SupportSettingModel.bulkWrite(ops);
  return getBrandDB(user_id);
};

const getSectionDB = async (user_id: string, key: string) => {
  const row = await SupportSettingModel.findOne({ user_id, key });
  if (!row?.value) return null;
  return typeof row.value === "string" ? JSON.parse(row.value) : row.value;
};

const saveSectionDB = async (user_id: string, key: string, value: unknown) => {
  await SupportSettingModel.updateOne(
    { user_id, key },
    { $set: { value: typeof value === "string" ? value : JSON.stringify(value) } },
    { upsert: true },
  );
  return getSectionDB(user_id, key);
};

export const setupService = {
  getBrandDB,
  updateBrandDB,
  getSectionDB,
  saveSectionDB,
  keys: {
    titleSections: "title_sections",
    ctaSections: "cta_sections",
    supportInformation: "support_information",
    contactInformation: "contact_information",
    privacyPolicy: "privacy_policy",
    termsConditions: "terms_conditions",
  },
};
