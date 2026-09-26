import { Types } from "mongoose";
import { AuthRequest } from "../../../../middlewares/auth";
import { UserModel } from "../../../basic_modules/user/user.model";
import { recruitmentSettingService } from "../recruitmentSetting/recruitmentSetting.service";
import { companyObjectId, companyScope, formatDateOnly, resolveCompanyId } from "../recruitment.utils";
import { OfferModel } from "./offer.model";
import { TOffer } from "./offer.interface";
import {
  OfferLetterVariableData,
  ensureOfferLetterTemplate,
  replaceOfferLetterVariables,
} from "./offerLetter.template";

const APP_NAME = process.env.APP_NAME || "ERP";

const letterPopulate = [
  { path: "candidate_id", select: "first_name last_name email phone" },
  {
    path: "job_id",
    select: "title posting_code",
    populate: [
      { path: "job_type_id", select: "name" },
      { path: "location_id", select: "name address city state country remote_work" },
    ],
  },
  { path: "department_id", select: "department_name" },
  { path: "approved_by", select: "name email" },
];

type PopulatedRef = {
  _id?: Types.ObjectId;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  title?: string;
  posting_code?: string;
  name?: string;
  department_name?: string;
  job_type_id?: { name?: string } | null;
  location_id?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    remote_work?: boolean;
  } | null;
};

const formatCurrency = (amount?: number | null) => {
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) return "N/A";
  return `$${Number(amount).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
};

const formatWorkplaceLocation = (job?: PopulatedRef | null) => {
  if (!job) return "Office";
  const loc = job.location_id;
  if (!loc) return "Office";
  if (loc.remote_work) return loc.name ? `${loc.name} (Remote)` : "Remote";
  const parts = [loc.address, loc.city, loc.state, loc.country].filter(Boolean);
  if (parts.length) return parts.join(", ");
  return loc.name || "Office";
};

const resolveCompanyContext = async (companyId: string) => {
  const company = await UserModel.findById(companyObjectId(companyId))
    .select("name email phone businessProfile image")
    .lean();

  const companyName =
    (company as { businessProfile?: { companyName?: string }; name?: string } | null)?.businessProfile
      ?.companyName ||
    (company as { name?: string } | null)?.name ||
    APP_NAME;

  return {
    companyName,
    companySettings: {
      company_name: companyName,
      logo_dark: (company as { image?: string } | null)?.image ?? null,
      logo_light: (company as { image?: string } | null)?.image ?? null,
      favicon: null,
    },
  };
};

const getOfferLetterTemplate = async (companyId: string) => {
  const raw = await recruitmentSettingService.getValue(companyObjectId(companyId), "offer_letter_template");
  return ensureOfferLetterTemplate(raw);
};

const resolveTemplateContent = async (companyId: string) => {
  const { content } = await getOfferLetterTemplate(companyId);
  return { content };
};

const buildVariableData = (
  offer: TOffer & {
    candidate_id?: PopulatedRef | Types.ObjectId;
    job_id?: PopulatedRef | Types.ObjectId;
    department_id?: PopulatedRef | Types.ObjectId;
  },
  companyName: string,
): OfferLetterVariableData => {
  const candidate =
    offer.candidate_id && typeof offer.candidate_id === "object" && "first_name" in offer.candidate_id
      ? offer.candidate_id
      : null;
  const job =
    offer.job_id && typeof offer.job_id === "object" && !("_bsontype" in offer.job_id)
      ? (offer.job_id as PopulatedRef)
      : null;
  const department =
    offer.department_id && typeof offer.department_id === "object" && "department_name" in offer.department_id
      ? offer.department_id
      : null;

  const applicantName = candidate
    ? `${candidate.first_name ?? ""} ${candidate.last_name ?? ""}`.trim() || "Candidate"
    : "Candidate";

  return {
    applicant_name: applicantName,
    candidate_name: applicantName,
    app_name: APP_NAME,
    company_name: companyName,
    job_title: offer.position || job?.title || "N/A",
    position: offer.position || job?.title || "N/A",
    job_type: job?.job_type_id?.name || "Full-time",
    start_date: formatDateOnly(offer.start_date) || "TBD",
    workplace_location: formatWorkplaceLocation(job),
    days_of_week: "Monday to Friday",
    salary: formatCurrency(offer.salary),
    salary_type: "year",
    salary_duration: "monthly",
    next_pay_period: "monthly",
    offer_expiration_date: formatDateOnly(offer.expiration_date) || "N/A",
    expiration_date: formatDateOnly(offer.expiration_date) || "N/A",
    offer_date: formatDateOnly(offer.offer_date) || "N/A",
    department: department?.department_name || "N/A",
    bonus: offer.bonus != null ? formatCurrency(offer.bonus) : "N/A",
  };
};

const formatOfferForLetter = (
  offer: TOffer & {
    candidate_id?: PopulatedRef | Types.ObjectId;
    job_id?: PopulatedRef | Types.ObjectId;
    department_id?: PopulatedRef | Types.ObjectId;
    approved_by?: PopulatedRef | Types.ObjectId;
  },
) => {
  const candidate =
    offer.candidate_id && typeof offer.candidate_id === "object" && "first_name" in offer.candidate_id
      ? {
          _id: offer.candidate_id._id,
          first_name: offer.candidate_id.first_name ?? null,
          last_name: offer.candidate_id.last_name ?? null,
          email: offer.candidate_id.email ?? null,
          phone: offer.candidate_id.phone ?? null,
        }
      : null;

  const job =
    offer.job_id && typeof offer.job_id === "object" && !("_bsontype" in offer.job_id)
      ? {
          _id: (offer.job_id as PopulatedRef)._id,
          title: (offer.job_id as PopulatedRef).title ?? null,
          posting_code: (offer.job_id as PopulatedRef).posting_code ?? null,
          job_type: (offer.job_id as PopulatedRef).job_type_id?.name ?? null,
          location: formatWorkplaceLocation(offer.job_id as PopulatedRef),
        }
      : null;

  const department =
    offer.department_id && typeof offer.department_id === "object" && "department_name" in offer.department_id
      ? {
          _id: offer.department_id._id,
          department_name: offer.department_id.department_name ?? null,
        }
      : null;

  const approvedBy =
    offer.approved_by && typeof offer.approved_by === "object" && "name" in offer.approved_by
      ? { _id: offer.approved_by._id, name: offer.approved_by.name ?? null }
      : null;

  return {
    _id: offer._id,
    candidate,
    job,
    department,
    approved_by: approvedBy,
    position: offer.position,
    salary: offer.salary ?? null,
    bonus: offer.bonus ?? null,
    equity: offer.equity ?? null,
    benefits: offer.benefits ?? null,
    start_date: formatDateOnly(offer.start_date),
    expiration_date: formatDateOnly(offer.expiration_date),
    offer_date: formatDateOnly(offer.offer_date),
    status: offer.status,
    approval_status: offer.approval_status,
    offer_letter_path: offer.offer_letter_path ?? null,
  };
};

const wrapLetterHtml = (body: string, companyName: string, logoUrl?: string | null) => {
  const logoBlock = logoUrl
    ? `<div style="margin-bottom:24px;"><img src="${logoUrl}" alt="${companyName}" style="height:48px;max-width:200px;object-fit:contain;" /></div>`
    : `<div style="margin-bottom:24px;font-size:20px;font-weight:700;">${companyName}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Offer Letter - ${companyName}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #111827; background: #f3f4f6; margin: 0; padding: 24px; }
    .page { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 10px 25px rgba(0,0,0,.08); }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: center; }
    p { line-height: 1.7; margin: 0 0 12px; }
  </style>
</head>
<body>
  <div class="page">
    ${logoBlock}
    <div class="content">${body}</div>
    <div class="footer">Generated on ${new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</div>
  </div>
</body>
</html>`;
};

const buildFilename = (candidate?: { first_name?: string | null; last_name?: string | null } | null) => {
  const name = `${candidate?.first_name ?? ""} ${candidate?.last_name ?? ""}`.trim() || "candidate";
  return `offer-letter-${name.replace(/\s+/g, "-").toLowerCase()}.pdf`;
};

const buildDownloadUrl = (req: AuthRequest, offerId: string) =>
  `${req.protocol}://${req.get("host")}/api/v1/recruitment/offers/download/${offerId}`;

const loadOfferForLetter = async (companyId: string, offerId: string) => {
  const offer = await OfferModel.findOne({ _id: offerId, ...companyScope(companyId), isDeleted: false })
    .populate(letterPopulate)
    .exec();
  return offer;
};

const buildOfferLetterDocument = async (req: AuthRequest, offerId: string) => {
  const companyId = resolveCompanyId(req);
  const offer = await loadOfferForLetter(companyId, offerId);
  if (!offer) return null;

  const { companyName, companySettings } = await resolveCompanyContext(companyId);
  const formattedOffer = formatOfferForLetter(offer as unknown as TOffer & { candidate_id?: PopulatedRef });

  if (offer.offer_letter_path) {
    return {
      source: "upload" as const,
      offer: formattedOffer,
      companyName,
      companySettings,
      offer_letter_path: offer.offer_letter_path,
      templateContent: null,
      html: null,
      filename: buildFilename(formattedOffer.candidate),
      download_url: buildDownloadUrl(req, offerId),
    };
  }

  const templatePack = await resolveTemplateContent(companyId);
  const variables = buildVariableData(offer as unknown as TOffer & { candidate_id?: PopulatedRef }, companyName);
  const templateContent = replaceOfferLetterVariables(templatePack.content, variables, APP_NAME);
  const html = wrapLetterHtml(templateContent, companyName, companySettings.logo_dark);

  return {
    source: "template" as const,
    offer: formattedOffer,
    companyName,
    companySettings,
    offer_letter_path: null,
    templateContent,
    html,
    filename: buildFilename(formattedOffer.candidate),
    download_url: buildDownloadUrl(req, offerId),
    placeholders: variables,
  };
};

export const offerLetterService = {
  getOfferLetterTemplate,
  ensureOfferLetterTemplate,
  resolveTemplateContent,
  buildOfferLetterDocument,
  buildDownloadUrl,
  loadOfferForLetter,
};
