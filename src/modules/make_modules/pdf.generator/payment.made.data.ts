/* eslint-disable @typescript-eslint/no-explicit-any */
import { VendorPaymentModel } from "../account/vendorPayment/vendorPayment.model";
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

// businessProfile address {address_line_1, address_line_2, city, state, country, zip_code}
const bpAddress = (a: any): string => {
  if (!a) return NA;
  const cityLine = [a.city, a.state].filter(Boolean).join(", ");
  const lines = [a.address_line_1, a.address_line_2, [cityLine, a.zip_code].filter(Boolean).join(" "), a.country]
    .map((l) => (l || "").trim())
    .filter(Boolean);
  return lines.length ? lines.join("\n") : NA;
};

const buildCompany = (user: any) => {
  const bp = user?.businessProfile || {};
  const addr = bpAddress(bp.billing_address);
  return {
    name: txt(bp.companyName || user?.name),
    regNo: txt(bp.reg_no),
    taxId: txt(bp.tax_number),
    address: addr !== NA ? addr : txt(user?.address),
    phone: txt(user?.phone),
    mobile: txt(user?.phone),
    fax: txt(bp.fax),
    email: txt(user?.email),
    website: txt(bp.website),
  };
};

/**
 * Resolve VendorPaymentModel → PAYMENT MADE PDF data shape (the layout the
 * generator renders: header totals, company, Paid To, payment + bill tables).
 * Mirrors resolvePaymentReceiptData; returns an "N/A" shell when there is no id
 * or the record isn't found, so the PDF still renders.
 */
export const resolvePaymentMadeData = async (id: string | undefined, user: IUser) => {
  const company = buildCompany(user);
  const currency = (user as any)?.currency || "";

  const empty = {
    invoiceNumber: NA,
    poNumber: NA,
    date: NA,
    dueDate: NA,
    total: NA,
    outstanding: NA,
    company,
    received: { name: company.name, regNo: company.regNo, taxId: company.taxId },
    billTo: {
      name: NA,
      email: NA,
      phone: NA,
      businessPhone: NA,
      poBox: NA,
      taxId: NA,
      regNo: NA,
      contactTaxId: NA,
      address: NA,
    },
    shipTo: { address: NA, shippingMethod: NA },
    signature: { companyName: company.name, subtitle: "Authorized Signatory" },
    qrCodeData: "",
    paymentDetails: [] as any[],
    invoiceDetails: [] as any[],
  };

  if (!id) return empty;

  const doc: any = await VendorPaymentModel.findOne({
    _id: id,
    user_id: (user as any)?._id,
  })
    .populate("vendor_id")
    .populate("bank_account_id", "account_name account_number")
    .populate("allocations.invoice_id", "invoice_number total balance_amount currency")
    .lean();

  if (!doc) return empty;

  const vendor = doc.vendor_id || {};
  const vbp = vendor.businessProfile || {};
  const cur = doc.allocations?.[0]?.invoice_id?.currency || currency;

  const billTo = {
    name: txt(vbp.companyName || vendor.name),
    email: txt(vendor.email),
    phone: txt(vendor.phone),
    businessPhone: txt(vendor.phone),
    poBox: NA,
    taxId: txt(vbp.tax_number),
    regNo: txt(vbp.reg_no),
    contactTaxId: txt(vbp.tax_number),
    address: bpAddress(vbp.billing_address),
  };

  const paymentNo =
    doc.payment_number || (doc._id ? String(doc._id).slice(-8).toUpperCase() : NA);

  // The bank account doubles as the "payment type" column in this layout.
  const bank = doc.bank_account_id || {};
  const paymentType = bank.account_name
    ? txt(bank.account_name)
    : txt(doc.reference_number);

  const paymentDetails = [
    {
      paymentNo: txt(paymentNo),
      date: fmtDate(doc.payment_date),
      amount: fmtMoney(doc.payment_amount, cur),
      paymentType,
    },
  ];

  // Bills this payment was allocated against.
  const invoiceDetails = (doc.allocations || []).map((a: any) => ({
    invoiceNo: txt(a.invoice_id?.invoice_number ?? a.invoice_id),
    amount: fmtMoney(a.allocated_amount, cur),
  }));

  const allocated = (doc.allocations || []).reduce(
    (s: number, a: any) => s + (Number(a.allocated_amount) || 0),
    0,
  );
  const outstanding = Math.max(0, (Number(doc.payment_amount) || 0) - allocated);

  return {
    invoiceNumber: txt(paymentNo),
    poNumber: txt(doc.reference_number),
    date: fmtDate(doc.payment_date),
    dueDate: fmtDate(doc.payment_date),
    total: fmtMoney(doc.payment_amount, cur),
    outstanding: fmtMoney(outstanding, cur),
    company,
    received: { name: company.name, regNo: company.regNo, taxId: company.taxId },
    billTo,
    shipTo: { address: NA, shippingMethod: NA },
    signature: { companyName: company.name, subtitle: "Authorized Signatory" },
    qrCodeData: "",
    paymentDetails,
    invoiceDetails,
  };
};
