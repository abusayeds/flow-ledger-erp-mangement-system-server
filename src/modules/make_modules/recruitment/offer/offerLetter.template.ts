/** Default English offer letter template. */
export const DEFAULT_OFFER_LETTER_TEMPLATE = `<p style="text-align: center;"><strong>Offer Letter</strong></p><p>Dear {applicant_name},</p><p>{app_name} is excited to bring you on board as {job_title}.</p><p>Please take the time to review our formal offer. It includes important details about your compensation, benefits, and the terms and conditions of your anticipated employment with {company_name}.</p><p>{company_name} is offering a {job_type} position for you as {job_title}, reporting to your manager starting on {start_date} at {workplace_location}. Expected hours of work are {days_of_week}.</p><p>In this position, {company_name} is offering to start you at a pay rate of {salary} per {salary_type}. You will be paid on a {salary_duration} basis.</p><p>As an employee of {company_name}, you will be eligible for the benefits described in your offer package.</p><p>Please indicate your agreement with these terms and accept this offer by signing and dating this agreement on or before {offer_expiration_date}.</p><p>Sincerely,</p><p>{company_name}</p>`;

export type OfferLetterTemplateValue = {
  content?: string;
  subject?: string;
  signature?: string;
};

export type OfferLetterVariableData = {
  applicant_name?: string;
  app_name?: string;
  company_name?: string;
  job_title?: string;
  job_type?: string;
  start_date?: string;
  workplace_location?: string;
  days_of_week?: string;
  salary?: string;
  salary_type?: string;
  salary_duration?: string;
  next_pay_period?: string;
  offer_expiration_date?: string;
  candidate_name?: string;
  position?: string;
  department?: string;
  bonus?: string;
  offer_date?: string;
  expiration_date?: string;
};

const LARAVEL_PLACEHOLDER_KEYS: (keyof OfferLetterVariableData)[] = [
  "applicant_name",
  "app_name",
  "company_name",
  "job_title",
  "job_type",
  "start_date",
  "workplace_location",
  "days_of_week",
  "salary",
  "salary_type",
  "salary_duration",
  "next_pay_period",
  "offer_expiration_date",
];

const LARAVEL_PLACEHOLDERS = LARAVEL_PLACEHOLDER_KEYS.map((k) => `{${k}}`);

const extractContent = (raw: unknown): string | undefined => {
  if (typeof raw === "string" && raw.trim()) return raw;
  if (!raw || typeof raw !== "object") return undefined;

  const value = raw as Record<string, unknown>;
  if (typeof value.content === "string" && value.content.trim()) return value.content;
  // The app's editor calls the letter text `body`.
  if (typeof value.body === "string" && value.body.trim()) return value.body;

  const templates = value.templates;
  if (templates && typeof templates === "object") {
    const en = (templates as Record<string, unknown>).en;
    if (typeof en === "string" && en.trim()) return en;
  }

  return undefined;
};

const extractString = (raw: unknown, key: string): string => {
  if (!raw || typeof raw !== "object") return "";
  const value = (raw as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
};

export const normalizeOfferLetterTemplateValue = (
  raw: unknown,
): OfferLetterTemplateValue & { content: string } => ({
  content: extractContent(raw) || DEFAULT_OFFER_LETTER_TEMPLATE,
  // Carried alongside `content` so the app's subject/signature fields persist.
  // Offer rendering only ever reads `content`, so it is unaffected.
  subject: extractString(raw, "subject"),
  signature: extractString(raw, "signature"),
});

export const ensureOfferLetterTemplate = (
  raw: unknown,
): OfferLetterTemplateValue & { content: string } => normalizeOfferLetterTemplateValue(raw);

/** Laravel OfferLetter::replaceVariable — same placeholder order and dash defaults. */
export const replaceOfferLetterVariables = (
  content: string,
  data: OfferLetterVariableData,
  appName = "ERP",
) => {
  const values: Record<string, string> = {
    applicant_name: "-",
    app_name: appName,
    company_name: "-",
    job_title: "-",
    job_type: "-",
    start_date: "-",
    workplace_location: "-",
    days_of_week: "-",
    salary: "-",
    salary_type: "-",
    salary_duration: "-",
    next_pay_period: "-",
    offer_expiration_date: "-",
  };

  for (const key of LARAVEL_PLACEHOLDER_KEYS) {
    const val = data[key];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      values[key] = String(val);
    }
  }

  if (values.company_name === "-" && data.company_name) {
    values.company_name = data.company_name;
  }

  let html = content;
  LARAVEL_PLACEHOLDERS.forEach((token, i) => {
    const key = LARAVEL_PLACEHOLDER_KEYS[i];
    html = html.split(token).join(values[key]);
  });

  const nodeAliases: Record<string, string | undefined> = {
    "{candidate_name}": data.candidate_name ?? data.applicant_name,
    "{position}": data.position ?? data.job_title,
    "{department}": data.department,
    "{bonus}": data.bonus,
    "{offer_date}": data.offer_date,
    "{expiration_date}": data.expiration_date ?? data.offer_expiration_date,
    "{company_name}": data.company_name ?? values.company_name,
  };

  for (const [token, val] of Object.entries(nodeAliases)) {
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      html = html.split(token).join(String(val));
    }
  }

  return html;
};
