import httpStatus from "http-status";
import { AuthRequest } from "../../../../middlewares/auth";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { resolveCompanyId } from "../recruitment.utils";
import { recruitmentSettingService } from "./recruitmentSetting.service";
import {
  ensureOfferLetterTemplate,
  normalizeOfferLetterTemplateValue,
} from "../offer/offerLetter.template";
import {
  DEFAULT_APPLICATION_TIPS,
  DEFAULT_TRACKING_FAQ,
  DEFAULT_WHAT_HAPPENS_NEXT,
} from "./recruitmentSetting.defaults";

const makeGet = (key: string, label: string) =>
  catchAsync(async (req: AuthRequest, res) => {
    const value = await recruitmentSettingService.getValue(resolveCompanyId(req), key);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: `${label} retrieved successfully`, data: value });
  });

/**
 * Like [makeGet], but writes `defaults` the first time a company reads the
 * section so the editor opens with usable starter content instead of an empty
 * list. Seeding only ever happens when nothing is stored — once the company has
 * saved (including saving an empty list) their value is returned untouched, so
 * deleted items never come back.
 */
const makeSeededGet = (key: string, label: string, defaults: unknown) =>
  catchAsync(async (req: AuthRequest, res) => {
    const companyId = resolveCompanyId(req);
    let value = await recruitmentSettingService.getValue(companyId, key);

    if (value === null || value === undefined) {
      value = await recruitmentSettingService.setValue(companyId, key, defaults);
    }

    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: `${label} retrieved successfully`, data: value });
  });

const makeUpdate = (key: string, label: string) =>
  catchAsync(async (req: AuthRequest, res) => {
    const value = await recruitmentSettingService.setValue(resolveCompanyId(req), key, req.body);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: `${label} updated successfully`, data: value });
  });

const OFFER_LETTER_PLACEHOLDERS = {
  "{applicant_name}": "Applicant Name",
  "{app_name}": "Application Name",
  "{company_name}": "Company Name",
  "{job_title}": "Job Title",
  "{job_type}": "Job Type",
  "{start_date}": "Start Date",
  "{workplace_location}": "Workplace Location",
  "{days_of_week}": "Days Of Week",
  "{salary}": "Salary",
  "{salary_type}": "Salary Type",
  "{salary_duration}": "Salary Duration",
  "{next_pay_period}": "Next Pay Period",
  "{offer_expiration_date}": "Offer Expiration Date",
  "{candidate_name}": "Candidate Name",
  "{position}": "Position",
  "{department}": "Department",
  "{bonus}": "Bonus",
  "{offer_date}": "Offer Date",
  "{expiration_date}": "Expiration Date",
};

const offerLetterTemplateGet = catchAsync(async (req: AuthRequest, res) => {
  const companyId = resolveCompanyId(req);
  const raw = await recruitmentSettingService.getValue(companyId, "offer_letter_template");
  const normalized = ensureOfferLetterTemplate(raw);

  if (!raw) {
    await recruitmentSettingService.setValue(companyId, "offer_letter_template", normalized);
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Offer letter template retrieved successfully",
    data: {
      content: normalized.content,
      // `body` mirrors `content` for the app's editor, which names it `body`.
      body: normalized.content,
      subject: normalized.subject ?? "",
      signature: normalized.signature ?? "",
    },
  });
});

const offerLetterTemplateUpdate = catchAsync(async (req: AuthRequest, res) => {
  const companyId = resolveCompanyId(req);
  const incoming = req.body?.settings?.content
    ? req.body.settings
    : req.body?.settings?.templates?.en
      ? { content: req.body.settings.templates.en }
      : req.body?.content
        ? req.body
        : req.body?.templates?.en
          ? { content: req.body.templates.en }
          : req.body;
  const normalized = normalizeOfferLetterTemplateValue(incoming);
  const value = await recruitmentSettingService.setValue(companyId, "offer_letter_template", normalized);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Offer letter template updated successfully",
    data: {
      content: value.content,
      body: value.content,
      subject: value.subject ?? "",
      signature: value.signature ?? "",
    },
  });
});

const getPlaceholders = catchAsync(async (_req: AuthRequest, res) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Offer letter placeholders retrieved successfully",
    data: { placeholders: OFFER_LETTER_PLACEHOLDERS },
  });
});

export const recruitmentSettingController = {
  brandSettingsGet: makeGet("brand_settings", "Brand settings"),
  brandSettingsUpdate: makeUpdate("brand_settings", "Brand settings"),
  aboutCompanyGet: makeGet("about_company", "About company"),
  aboutCompanyUpdate: makeUpdate("about_company", "About company"),
  applicationTipsGet: makeSeededGet("application_tips", "Application tips", DEFAULT_APPLICATION_TIPS),
  applicationTipsUpdate: makeUpdate("application_tips", "Application tips"),
  whatHappensNextGet: makeSeededGet("what_happens_next", "What happens next", DEFAULT_WHAT_HAPPENS_NEXT),
  whatHappensNextUpdate: makeUpdate("what_happens_next", "What happens next"),
  needHelpGet: makeGet("need_help", "Need help"),
  needHelpUpdate: makeUpdate("need_help", "Need help"),
  trackingFaqGet: makeSeededGet("tracking_faq", "Tracking FAQ", DEFAULT_TRACKING_FAQ),
  trackingFaqUpdate: makeUpdate("tracking_faq", "Tracking FAQ"),
  offerLetterTemplateGet,
  offerLetterTemplateUpdate,
  dashboardWelcomeCardGet: makeGet("dashboard_welcome_card", "Dashboard welcome card"),
  dashboardWelcomeCardUpdate: makeUpdate("dashboard_welcome_card", "Dashboard welcome card"),
  getPlaceholders,
};
