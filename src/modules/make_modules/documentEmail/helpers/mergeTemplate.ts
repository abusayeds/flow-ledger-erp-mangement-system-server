import { TResolvedDocument } from "../documentEmail.interface";

const fmtDate = (d: Date | string | null | undefined): string => {
  if (!d) return "";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const fmtMoney = (total: number | null | undefined, currency: string | null | undefined) => {
  if (total === null || total === undefined || Number.isNaN(Number(total))) return "";
  const cur = currency || "";
  return `${cur} ${Number(total).toFixed(2)}`.trim();
};

/** Build placeholder map from resolved document + company user. */
export const buildTemplateVars = (document: TResolvedDocument): Record<string, string> => {
  const party = document.party_name || "";
  const nameParts = party.trim().split(/\s+/).filter(Boolean);
  const fname = nameParts[0] || "";
  const lname = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
  const number = document.number || "";
  const company = document.company_name || "";
  const total = fmtMoney(document.total, document.currency);
  const status = document.status || "";
  const date = fmtDate(document.date);
  const due = fmtDate(document.due_date);

  return {
    // snake_case ({{…}}) — existing app keys
    customer_name: party,
    vendor_name: party,
    party_name: party,
    party_email: document.party_email || "",
    company_name: company,
    invoice_number: number,
    document_number: number,
    number,
    status,
    total,
    currency: document.currency || "",
    date,
    due_date: due,
    // Moon-style angle tags (<…>) used by Email Templates UI
    customer: party,
    fname,
    lname,
    org: party,
    company,
    "invoice#": number,
    due_amount: total,
    terms: "",
    notes: "",
    sign1: "",
    sign2: "",
    paynow: "",
    shipping_cost: "",
    shipping_method: "",
    deposit_due_amount: "",
    pdf_file: "",
    attachment: "",
  };
};

/** Replace {{key}} and <tag> placeholders in a string (additive; both formats work). */
export const mergeTemplateString = (
  template: string | undefined | null,
  vars: Record<string, string>,
): string => {
  if (!template) return "";
  let out = template.replace(/\{\{\s*([a-zA-Z0-9_#]+)\s*\}\}/g, (_, key: string) =>
    vars[key] !== undefined ? vars[key] : "",
  );
  out = out.replace(/<([a-zA-Z0-9_#]+)>/g, (_, key: string) =>
    vars[key] !== undefined ? vars[key] : `<${key}>`,
  );
  return out;
};

export const splitEmailList = (value: string | string[] | undefined | null): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return [...new Set(value.map((v) => String(v).trim()).filter(Boolean))];
  }
  return [
    ...new Set(
      String(value)
        .split(/[,;]/)
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  ];
};
