import httpStatus from "http-status";
import { TErrorSoureces, TGenericErrorResponse } from "../interface/error";

/** Human labels for common unique-index fields. */
const FIELD_LABELS: Record<string, string> = {
  email: "email",
  phone: "phone number",
  sku: "SKU",
  invoice_number: "invoice number",
  bill_number: "bill number",
  estimate_number: "estimate number",
  proforma_number: "proforma invoice number",
  sales_receipt_number: "sales receipt number",
  purchase_order_number: "purchase order number",
  credit_note_number: "credit note number",
  debit_note_number: "debit note number",
  payment_number: "payment number",
  expense_number: "expense number",
  code: "code",
  name: "name",
  username: "username",
};

const labelForField = (field: string): string => {
  const key = String(field || "").trim();
  if (!key) return "value";
  return FIELD_LABELS[key] || key.replace(/_/g, " ");
};

/**
 * Mongo E11000 duplicate-key → clear message for the UI.
 * Prefers `err.keyValue` / `err.keyPattern`; falls back to parsing the raw message.
 */
const handleDuplicateError = (err: any): TGenericErrorResponse => {
  const keyValue: Record<string, unknown> =
    err?.keyValue && typeof err.keyValue === "object" ? err.keyValue : {};
  const keyPattern: Record<string, unknown> =
    err?.keyPattern && typeof err.keyPattern === "object" ? err.keyPattern : {};

  let field =
    Object.keys(keyValue)[0] ||
    Object.keys(keyPattern)[0] ||
    "";
  let value = field ? keyValue[field] : undefined;

  // Fallback: E11000 ... dup key: { email: "a@b.com" }
  if (!field && typeof err?.message === "string") {
    const dupMatch = err.message.match(/dup key:\s*\{\s*([^:]+):\s*(?:"([^"]*)"|([^\s,}]+))/i);
    if (dupMatch) {
      field = String(dupMatch[1] || "").trim();
      value = dupMatch[2] ?? dupMatch[3];
    } else {
      const quoted = err.message.match(/"([^"]+)"/);
      if (quoted?.[1]) value = quoted[1];
    }
  }

  const fieldLabel = labelForField(field);
  const displayValue =
    value !== undefined && value !== null && String(value).trim() !== ""
      ? String(value).trim()
      : "";

  let message: string;
  if (field === "email" || /email/i.test(field)) {
    message = displayValue
      ? `This email (${displayValue}) is already registered. Please use a different email.`
      : "This email is already registered. Please use a different email.";
  } else if (displayValue) {
    message = `This ${fieldLabel} (${displayValue}) already exists. Please use a different ${fieldLabel}.`;
  } else if (field) {
    message = `This ${fieldLabel} already exists. Please use a different ${fieldLabel}.`;
  } else {
    message = "This record already exists. Please check and try again with a different value.";
  }

  const errorSoures: TErrorSoureces = [
    {
      path: field || "",
      message,
    },
  ];

  return {
    statusCode: httpStatus.CONFLICT,
    message,
    errorSoures,
  };
};

export default handleDuplicateError;
