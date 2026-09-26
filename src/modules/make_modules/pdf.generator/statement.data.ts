/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserModel } from "../../basic_modules/user/user.model";
import { InvoiceModel } from "../invoice/invoice.model";
import { PaymentModel } from "../addPayment/payment.model";
import { BillModel } from "../bill/bill.model";
import { VendorPaymentModel } from "../account/vendorPayment/vendorPayment.model";
import { IUser } from "../../basic_modules/user/user.interface";
import { role as roleEnum } from "../../../utils/role";

const NA = "N/A";

const fmtDate = (d: any): string => {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  // "18 Jun, 2026" — matches the app's statement date format.
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${day} ${month}, ${date.getFullYear()}`;
};

const money = (v: any, currency?: string): string => {
  const n = Number(v) || 0;
  const cur = (currency || "").trim();
  // 2 decimals: a statement has to tie out against the balances shown
  // elsewhere in the app (the contact list shows e.g. 612.36, not 612).
  return `${n.toFixed(2)}${cur ? ` ${cur}` : ""}`;
};

/** Inclusive day bounds, so a document dated on `to` is still included. */
const dayRange = (from?: string, to?: string) => {
  const start = from ? new Date(from) : null;
  const end = to ? new Date(to) : null;
  if (start && !Number.isNaN(start.getTime())) start.setHours(0, 0, 0, 0);
  if (end && !Number.isNaN(end.getTime())) end.setHours(23, 59, 59, 999);
  const range: any = {};
  if (start && !Number.isNaN(start.getTime())) range.$gte = start;
  if (end && !Number.isNaN(end.getTime())) range.$lte = end;
  return Object.keys(range).length ? range : null;
};

export type StatementOpts = { from?: string; to?: string; thermal?: boolean };

/**
 * Account statement for one customer/vendor: every document and payment in the
 * period, oldest first, with a running balance.
 *
 * Shape mirrors the app's StatementData (lib/shared/pdf/statement_pdf.dart) so
 * the server PDF renders the same layout the app used to build on-device.
 */
export const resolveStatementData = async (
  contactId: string | undefined,
  user: IUser,
  opts: StatementOpts = {},
) => {
  const bp = (user as any)?.businessProfile || {};
  const businessName = String(bp.companyName || user?.name || "Company");
  const businessLines = [user?.email, (user as any)?.phone]
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  const empty = {
    title: "STATEMENT",
    businessName,
    businessLines,
    statementTo: [] as string[],
    date: fmtDate(opts.to) || fmtDate(new Date()),
    amount: money(0),
    paid: money(0),
    balance: money(0),
    rows: [] as any[],
    total: { date: "", details: "Total", amount: "", paid: "", balance: money(0) },
  };

  if (!contactId) return empty;

  const contact: any = await UserModel.findOne({
    _id: contactId,
    companyId: (user as any)?._id,
  }).lean();
  if (!contact) return empty;

  const isVendor = contact.role === roleEnum.vendor;
  const cbp = contact.businessProfile || {};
  const currency = contact.currency || (user as any)?.currency || "";

  const statementTo = [
    cbp.companyName,
    contact.name,
    contact.email,
    contact.phone,
    [cbp.billing_address?.city, cbp.billing_address?.country].filter(Boolean).join(", "),
  ]
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  const range = dayRange(opts.from, opts.to);
  const dateFilter = range ? { date: range } : {};
  const payDateFilter = range ? { payment_date: range } : {};
  const scope = { user_id: (user as any)?._id, isDeleted: false };

  // Documents raise the balance; payments reduce it.
  const [docs, pays] = isVendor
    ? await Promise.all([
        BillModel.find({ ...scope, vendor_id: contactId, status: { $nin: ["Draft", "draft"] }, ...dateFilter })
          .select("invoice_number date total currency")
          .sort({ date: 1 })
          .lean(),
        VendorPaymentModel.find({ ...scope, vendor_id: contactId, ...payDateFilter })
          .select("payment_number payment_date payment_amount")
          .sort({ payment_date: 1 })
          .lean(),
      ])
    : await Promise.all([
        InvoiceModel.find({ ...scope, customer_id: contactId, status: { $nin: ["Draft", "draft"] }, ...dateFilter })
          .select("invoice_number date total currency")
          .sort({ date: 1 })
          .lean(),
        PaymentModel.find({ ...scope, customer_id: contactId, ...payDateFilter })
          .select("payment_number payment_date amount")
          .sort({ payment_date: 1 })
          .lean(),
      ]);

  // Anything dated before the period still owes/credits, so it has to carry
  // forward — otherwise a customer whose only invoice predates the window
  // shows a 0 balance that contradicts their outstanding on the contact list.
  const priorFrom = range?.$gte;
  let opening = Number(cbp.opening_balance) || 0;
  if (priorFrom) {
    const beforeDoc = { date: { $lt: priorFrom } };
    const beforePay = { payment_date: { $lt: priorFrom } };
    const [priorDocs, priorPays] = isVendor
      ? await Promise.all([
          BillModel.find({ ...scope, vendor_id: contactId, status: { $nin: ["Draft", "draft"] }, ...beforeDoc })
            .select("total")
            .lean(),
          VendorPaymentModel.find({ ...scope, vendor_id: contactId, ...beforePay })
            .select("payment_amount")
            .lean(),
        ])
      : await Promise.all([
          InvoiceModel.find({ ...scope, customer_id: contactId, status: { $nin: ["Draft", "draft"] }, ...beforeDoc })
            .select("total")
            .lean(),
          PaymentModel.find({ ...scope, customer_id: contactId, ...beforePay })
            .select("amount")
            .lean(),
        ]);
    const sum = (rows: any[], key: string) =>
      rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);
    opening +=
      sum(priorDocs as any[], "total") -
      sum(priorPays as any[], isVendor ? "payment_amount" : "amount");
  }

  type Entry = { at: number; date: string; details: string; debit: number; credit: number };
  const entries: Entry[] = [];

  for (const d of docs as any[]) {
    entries.push({
      at: new Date(d.date || 0).getTime(),
      date: fmtDate(d.date),
      details: `${isVendor ? "Bill" : "Invoice"} #${d.invoice_number || NA}`,
      debit: Number(d.total) || 0,
      credit: 0,
    });
  }
  for (const p of pays as any[]) {
    entries.push({
      at: new Date(p.payment_date || 0).getTime(),
      date: fmtDate(p.payment_date),
      details: `Payment #${p.payment_number || NA}`,
      debit: 0,
      credit: Number(p.payment_amount ?? p.amount) || 0,
    });
  }

  entries.sort((a, b) => a.at - b.at);

  let running = opening;
  const rows: any[] = [];
  if (opening) {
    rows.push({
      date: fmtDate(opts.from) || "",
      details: "Opening Balance",
      amount: "",
      paid: "",
      balance: money(running, currency),
    });
  }
  for (const e of entries) {
    running += e.debit - e.credit;
    rows.push({
      date: e.date,
      details: e.details,
      amount: e.debit ? money(e.debit, currency) : "",
      paid: e.credit ? money(e.credit, currency) : "",
      balance: money(running, currency),
    });
  }

  const totalDebit = entries.reduce((s, e) => s + e.debit, 0) + opening;
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

  return {
    title: "STATEMENT",
    businessName,
    businessLines,
    statementTo,
    date: fmtDate(opts.to) || fmtDate(new Date()),
    amount: money(totalDebit, currency),
    paid: money(totalCredit, currency),
    balance: money(running, currency),
    rows,
    total: {
      date: "",
      details: "Total",
      amount: money(totalDebit, currency),
      paid: money(totalCredit, currency),
      balance: money(running, currency),
    },
  };
};
