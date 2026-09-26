import { SupportSettingModel } from "../settings/settings.model";
import { TicketCategoryModel } from "../ticketCategory/ticketCategory.model";
import { TicketFieldModel } from "../ticketField/ticketField.model";

const DEFAULT_CATEGORIES = [
  { name: "Technical Support", color: "#3B82F6" },
  { name: "Billing", color: "#10b77f" },
  { name: "General Inquiry", color: "#F59E0B" },
  { name: "Bug Report", color: "#8B5CF6" },
  { name: "Feature Request", color: "#EF4444" },
];

const DEFAULT_FIELDS = [
  { name: "Name", type: "text", placeholder: "Enter Name", width: "6", order: 0, custom_id: 1 },
  { name: "Email", type: "email", placeholder: "Enter Email", width: "6", order: 1, custom_id: 2 },
  { name: "Category", type: "text", placeholder: "Select Category", width: "6", order: 2, custom_id: 3 },
  { name: "Subject", type: "text", placeholder: "Enter Subject", width: "6", order: 3, custom_id: 4 },
  { name: "Description", type: "textarea", placeholder: "Enter Description", width: "12", order: 4, custom_id: 5 },
  { name: "Attachments", type: "file", placeholder: "You can select multiple files", width: "12", order: 5, custom_id: 6 },
];

const DEFAULT_BRAND = {
  logo_dark: "logo.png",
  favicon: "favicon.png",
  title_text: "Support Ticket System",
  footer_text: `© ${new Date().getFullYear()} Support System. All rights reserved.`,
};

/** Laravel SupporUtility::defaultdata + SupportTicketSetting::defaultdata */
export const ensureSupportDefaults = async (companyId: string) => {
  const uid = companyId;
  const catCount = await TicketCategoryModel.countDocuments({ user_id: uid, isDeleted: false });
  if (catCount === 0) {
    await TicketCategoryModel.insertMany(
      DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: uid, creator_id: uid, isDeleted: false })),
    );
  }

  const fieldCount = await TicketFieldModel.countDocuments({ user_id: uid, isDeleted: false });
  if (fieldCount === 0) {
    await TicketFieldModel.insertMany(
      DEFAULT_FIELDS.map((f) => ({
        ...f,
        user_id: uid,
        creator_id: uid,
        is_required: true,
        status: true,
        isDeleted: false,
      })),
    );
  }

  for (const [key, value] of Object.entries(DEFAULT_BRAND)) {
    await SupportSettingModel.updateOne(
      { user_id: uid, key },
      { $setOnInsert: { value } },
      { upsert: true },
    );
  }
};
