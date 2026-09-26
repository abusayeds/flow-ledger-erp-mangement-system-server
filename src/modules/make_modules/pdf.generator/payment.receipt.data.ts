/* eslint-disable @typescript-eslint/no-explicit-any */
import { PaymentReceivedModel } from "../paymentReceived/paymentReceived.model";
import { IUser } from "../../basic_modules/user/user.interface";

const NA = "N/A";
const txt = (v: any): string => (v === undefined || v === null || v === "" ? NA : String(v));
const fmtDate = (d: any): string => {
  if (!d) return NA;
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? NA
    : date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};
const fmtMoney = (amount: any, currency?: string): string => {
  const n = Number(amount);
  if (!Number.isFinite(n)) return NA;
  const cur = currency || "";
  return `${n.toFixed(2)}${cur ? ` ${cur}` : ""}`.trim();
};

const bpAddressCountry = (user: any): string => {
  const bp = user?.businessProfile || {};
  return txt(bp.billing_address?.country || user?.country || "");
};

/**
 * Resolve PaymentModel → PAYMENT RECEIPT PDF data shape.
 * Layout matches: title, logo, company, Received From, payment table, signature.
 */
export const resolvePaymentReceiptData = async (id: string | undefined, user: IUser) => {
  const bp = (user as any)?.businessProfile || {};
  const company = {
    name: txt(bp.companyName || user?.name),
    country: bpAddressCountry(user) === NA ? "" : bpAddressCountry(user),
    email: txt(user?.email),
    logo: (user as any)?.image || bp.logo || null,
    signature: (user as any)?.signature || null,
  };

  const empty = {
    title: "PAYMENT RECEIPT",
    company,
    receivedFrom: {
      name: NA,
      companyName: NA,
      email: NA,
      mobile: NA,
      taxId: NA,
      regNo: NA,
      lines: [] as string[],
    },
    payment: {
      paymentNo: NA,
      date: NA,
      amount: NA,
      paymentType: NA,
    },
    signature: {
      image: company.signature,
      companyName: company.name,
    },
  };

  if (!id) return empty;

  const doc: any = await PaymentReceivedModel.findOne({
    _id: id,
    user_id: user._id,
    isDeleted: false,
  })
    .populate("customer_id")
    .lean();

  if (!doc) return empty;

  const customer = doc.customer_id || {};
  const cbp = customer.businessProfile || {};
  const receivedFrom = {
    // The party can be a picked contact OR a typed free-text customer_name —
    // fall back to the free-text field so the name isn't dropped.
    name: txt(customer.name || doc.customer_name),
    companyName: txt(cbp.companyName),
    email: txt(customer.email),
    mobile: txt(customer.phone),
    taxId: txt(cbp.tax_number),
    regNo: txt(cbp.reg_no),
    lines: [] as string[],
  };

  // Build display lines like the screenshot (skip empty / N/A)
  const lineCandidates = [
    receivedFrom.name,
    receivedFrom.companyName,
    receivedFrom.email,
    receivedFrom.mobile !== NA ? `Mobile: ${receivedFrom.mobile}` : NA,
    receivedFrom.taxId,
    receivedFrom.regNo,
  ];
  receivedFrom.lines = lineCandidates.filter((l) => l && l !== NA);

  const currency = doc.currency || (user as any)?.currency || "";

  const paymentNo =
    doc.invoice_number ||
    (doc._id ? String(doc._id).slice(-8).toUpperCase() : NA);

  // payment_method is a string array (e.g. ["Stripe"]) on PaymentReceived.
  const paymentType = Array.isArray(doc.payment_method)
    ? doc.payment_method.filter(Boolean).join(", ")
    : doc.payment_method;

  return {
    title: "PAYMENT RECEIPT",
    company,
    receivedFrom,
    payment: {
      paymentNo: txt(paymentNo),
      date: fmtDate(doc.date),
      amount: fmtMoney(doc.total, currency),
      paymentType: txt(paymentType),
    },
    signature: {
      image: company.signature,
      companyName: company.name,
    },
  };
};
