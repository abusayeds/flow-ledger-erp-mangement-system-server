/* eslint-disable @typescript-eslint/no-explicit-any */
// Resolves real document data into the shape the PDF generators expect.
// Missing fields fall back to "N/A"; when no id is given (or the doc is not
// found) a blank skeleton is returned so a valid PDF is still produced.
//
// All "sales document" types share the same invoice-style schema
// (product[]/service[]/addresses/totals + a customer or vendor party), so one
// generic resolver + the invoice generator render them all.
import { InvoiceModel } from "../invoice/invoice.model";
import { SalesReceiptModel } from "../salesReceipt/salesReceipt.model";
import { ProformaInvoiceModel } from "../proformaInvoice/proformaInvoice.model";
import { EstimateModel } from "../estimate/estimate.model";
import { DeliveryChallanModel } from "../deliveryChallan/deliveryChallan.model";
import { BillModel } from "../bill/bill.model";
import { CreditNoteModel } from "../creditNote/creditNote.model";
import { DebitNoteModel } from "../debitNote/debitNote.model";
import { ExpensesModel } from "../expenses/expenses.model";
import { PurchaseInvoiceModel } from "../purchase/purchaseInvoice/purchaseInvoice.model";
import { PaymentReceivedModel } from "../paymentReceived/paymentReceived.model";
import { PaymentModel } from "../addPayment/payment.model";
import { VendorPaymentModel } from "../account/vendorPayment/vendorPayment.model";
import { PaymentMethodModel } from "../setting/paymentMethod/paymentMethod.model";
import { SignatureModel } from "../setting/signature/signature.model";

export const NA = "N/A";

type DocConfig = { model: any; party: "customer_id" | "vendor_id"; title: string; billLabel: string };

// type → which model / party / header title / "… To:" label
// NOTE: Payment receipt uses PaymentModel via payment.receipt.data.ts (not invoice-style).
const DOC_CONFIG: Record<string, DocConfig> = {
  Invoice:          { model: InvoiceModel,         party: "customer_id", title: "INVOICE",          billLabel: "Invoice To:" },
  Sales_Receipt:    { model: SalesReceiptModel,    party: "customer_id", title: "SALES RECEIPT",    billLabel: "Receipt To:" },
  Proforma_Invoice: { model: ProformaInvoiceModel, party: "customer_id", title: "PROFORMA INVOICE", billLabel: "Invoice To:" },
  Estimate:         { model: EstimateModel,        party: "customer_id", title: "ESTIMATE",         billLabel: "Estimate To:" },
  Delivery_Challan: { model: DeliveryChallanModel, party: "customer_id", title: "DELIVERY CHALLAN", billLabel: "Deliver To:" },
  Bill:             { model: BillModel,            party: "vendor_id",   title: "BILL",             billLabel: "Bill From:" },
  Credit_Note:      { model: CreditNoteModel,      party: "customer_id", title: "CREDIT NOTE",      billLabel: "Credit To:" },
  Debit_Note:       { model: DebitNoteModel,       party: "vendor_id",   title: "DEBIT NOTE",       billLabel: "Debit To:" },
  Expense:          { model: ExpensesModel,        party: "vendor_id",   title: "EXPENSE",          billLabel: "Expense To:" },
  Purchase_Order:   { model: PurchaseInvoiceModel, party: "vendor_id",   title: "PURCHASE ORDER",   billLabel: "Order To:" },
  // Same invoice document, different PDF title/settings (opened from invoice ⋮ menu).
  Packing_Slip:     { model: InvoiceModel,         party: "customer_id", title: "PACKING SLIP",     billLabel: "Ship To:" },
  Delivery_Note:    { model: InvoiceModel,         party: "customer_id", title: "DELIVERY NOTE",    billLabel: "Deliver To:" },
};

export const isSalesDoc = (type: string): boolean => Boolean(DOC_CONFIG[type]);

export const getDocConfig = (type: string) => DOC_CONFIG[type] || null;

// Invoice-style types wired to live data (derived from the config — no hardcoding).
export const getSalesDocTypes = () =>
  Object.entries(DOC_CONFIG).map(([type, cfg]) => ({
    type,
    title: cfg.title,
    dataSource: "live" as const,
  }));

const txt = (v: any): string => (v === undefined || v === null || v === "" ? NA : String(v));
const num = (v: any): number => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const money = (v: any, currency: string): string => {
  const n = Number(v);
  return Number.isFinite(n) ? `${currency} ${n.toFixed(2)}`.trim() : NA;
};
const qty = (v: any): string => { const n = Number(v); return Number.isFinite(n) ? n.toFixed(3) : NA; };
const fmtDate = (d: any): string => {
  if (!d) return NA;
  const date = new Date(d);
  return isNaN(date.getTime()) ? NA : date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

// addressSchema → "street\nstreet2\ncity, state zip\ncountry"
const docAddress = (a: any): string => {
  if (!a) return NA;
  const cityLine = [a.city, a.state].filter(Boolean).join(", ");
  const lines = [a.street, a.street2, [cityLine, a.zip].filter(Boolean).join(" "), a.country]
    .map((l) => (l || "").trim()).filter(Boolean);
  return lines.length ? lines.join("\n") : NA;
};

// businessProfile address {address_line_1, address_line_2, city, state, country, zip_code}
const bpAddress = (a: any): string => {
  if (!a) return NA;
  const cityLine = [a.city, a.state].filter(Boolean).join(", ");
  const lines = [a.address_line_1, a.address_line_2, [cityLine, a.zip_code].filter(Boolean).join(" "), a.country]
    .map((l) => (l || "").trim()).filter(Boolean);
  return lines.length ? lines.join("\n") : NA;
};

// Sender company = the logged-in company user.
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

const emptyContact = () => ({
  name: NA, email: NA, phone: NA, businessPhone: NA, poBox: NA,
  taxId: NA, regNo: NA, contactTaxId: NA, address: NA,
});

const buildSample = (company: any, cfg: DocConfig) => ({
  docTitle: cfg.title,
  billLabel: cfg.billLabel,
  currency: "USD",
  invoiceNumber: NA, poNumber: NA, date: NA, dueDate: NA, total: NA, outstanding: NA,
  company,
  billTo: emptyContact(),
  shipTo: { address: NA, shippingMethod: NA },
  products: [] as any[],
  services: [] as any[],
  summary: { subTotal: 0, discountPercent: 0, discountAmount: 0, inlineDiscount: 0, shippingCost: 0, deposit: 0, depositDue: 0, tax: 0, taxBreakdown: [] as any[], total: 0, amountPaid: 0, returnOrder: 0, amountDue: 0 },
  termsAndConditions: NA,
  notes: NA,
  hsnSacSummary: [] as any[],
  signature: {
    companyName: company.name,
    subtitle: "Authorized Signatory",
    companyImage: null,
    image: null,
    customerImage: null,
  },
  qrCodeData: NA,
  paymentDetails: [] as any[],
});

/** Generic resolver for every invoice-style document. */
export const resolveSalesDoc = async (type: string, id: string | undefined, user: any) => {
  const cfg = DOC_CONFIG[type];
  if (!cfg) return null;
  const company = buildCompany(user);
  if (!id) return buildSample(company, cfg);

  const inv: any = await cfg.model
    .findOne({ _id: id, user_id: user?._id, isDeleted: false })
    .populate(cfg.party)
    .populate("product.product_id")
    .populate("service.service_id")
    .lean()
    .catch(() => null);

  if (!inv) return buildSample(company, cfg);

  // Company / Authorized Signatory image from Settings → Signatures
  // (Companies page). Separate from per-document customer signatures.
  const companySig: any = await SignatureModel.findOne({
    user_id: user?._id,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .lean()
    .catch(() => null);

  const cur = inv.currency || "USD";
  const c = inv[cfg.party] || {};

  // Payment history for the invoice PDF: every payment recorded against this
  // invoice — both direct customer payments (PaymentReceived) and invoice-linked
  // payments (addPayment) — so the PDF's "Payment Details" table is complete.
  let paymentDetails: any[] = [];
  const method1 = (m: any): string =>
    txt(Array.isArray(m) ? m[0] : m) !== NA
      ? String(Array.isArray(m) ? m[0] : m)
      : "";
  if (type === "Invoice") {
    const [received, applied] = await Promise.all([
      PaymentReceivedModel.find({ invoice_id: inv._id, user_id: user?._id, isDeleted: false })
        .sort({ date: 1 }).lean().catch(() => [] as any[]),
      PaymentModel.find({ invoice_id: inv._id, user_id: user?._id, isDeleted: { $ne: true } })
        .sort({ payment_date: 1 }).lean().catch(() => [] as any[]),
    ]);
    const fromReceived = (received as any[]).map((p) => {
      const raw = num(p.total ?? p.sub_total);
      return {
        paymentNo: txt(p.payment_number || p.invoice_number),
        date: fmtDate(p.date),
        rawAmount: raw,
        amount: money(raw, cur),
        method: method1(p.payment_method) || "Cash",
        status: txt(p.status) !== NA ? String(p.status) : "Paid",
      };
    });
    const fromApplied = (applied as any[]).map((p) => {
      const raw = num(p.amount);
      return {
        paymentNo: txt(p.payment_number || p.reference_number),
        date: fmtDate(p.payment_date),
        rawAmount: raw,
        amount: money(raw, cur),
        method: method1(p.payment_method) || (txt(p.payment_type) !== NA ? String(p.payment_type) : "Cash"),
        status: txt(p.status) !== NA ? String(p.status) : "Paid",
      };
    });
    paymentDetails = [...fromReceived, ...fromApplied];
  } else if (type === "Bill" || type === "Purchase_Order") {
    // Vendor payments recorded against this bill / purchase order (VendorPayment
    // allocations reference the doc via allocations.invoice_id), so the PDF
    // shows a complete payment history the same way the Invoice does.
    const vps = await VendorPaymentModel.find({
      "allocations.invoice_id": inv._id,
      user_id: user?._id,
      isDeleted: { $ne: true },
    }).sort({ payment_date: 1 }).lean().catch(() => [] as any[]);
    paymentDetails = (vps as any[]).map((p) => {
      const alloc = (p.allocations || []).find(
        (a: any) => String(a.invoice_id) === String(inv._id),
      );
      const raw = num(alloc ? (alloc.applied_amount ?? alloc.allocated_amount) : p.payment_amount);
      return {
        paymentNo: txt(p.payment_number || p.reference_number),
        date: fmtDate(p.payment_date),
        rawAmount: raw,
        amount: money(raw, cur),
        method: method1(p.payment_method) || "Cash",
        status: txt(p.status) !== NA ? String(p.status) : "",
      };
    });
  }
  // Payment totals for the "Payment Details" summary: what's been paid so far
  // and the remaining balance (doc total − paid), both in the doc's currency.
  const totalPaidNum = paymentDetails.reduce((s: number, p: any) => s + (p.rawAmount || 0), 0);
  const paymentSummary = paymentDetails.length
    ? { totalPaid: money(totalPaidNum, cur), balance: money(num(inv.total) - totalPaidNum, cur) }
    : null;

  // Accepted payment methods for the invoice, each joined to its configured
  // logo so the PDF can show the method with its brand image.
  let paymentMethods: any[] = [];
  if (Array.isArray(inv.payment_method) && inv.payment_method.length) {
    const methods = await PaymentMethodModel.find({ user_id: user?._id })
      .lean().catch(() => [] as any[]);
    const byName = new Map(
      (methods as any[]).map((m) => [String(m.name).trim().toLowerCase(), m.logo]),
    );
    paymentMethods = (inv.payment_method as any[])
      .filter(Boolean)
      .map((n) => ({
        name: String(n),
        logo: byName.get(String(n).trim().toLowerCase()) || null,
      }));
  }
  const cbp = c.businessProfile || {};
  // The party can be a picked contact (customer_id/vendor_id) OR a typed
  // free-text name (customer_name/vendor_name) with no id — fall back to it so
  // the Bill-To name isn't dropped. See party-id-optional-free-text.
  const freeName = inv[cfg.party.replace("_id", "_name")];

  const billTo = {
    name: txt(cbp.companyName || c.name || freeName),
    email: txt(c.email),
    phone: txt(c.phone),
    businessPhone: txt(c.phone),
    poBox: NA,
    taxId: txt(cbp.tax_number),
    regNo: txt(cbp.reg_no),
    contactTaxId: txt(cbp.tax_number),
    address: docAddress(inv.billing_address) !== NA ? docAddress(inv.billing_address) : bpAddress(cbp.billing_address),
  };

  const products = (inv.product || []).map((p: any, i: number) => {
    const prod = p.product_id || {};
    return {
      srNo: i + 1,
      // Fall back to the free-text product_name when no product was picked.
      name: txt(prod.productName || p.product_name),
      description: prod.description || "",
      hsn: txt(prod.sku),
      quantity: qty(p.quantity),
      unitPrice: money(p.rate, cur),
      discount: money(p.discount, cur),
      gst: money(p.tax, cur),
      amount: money(p.amount, cur),
    };
  });

  const services = (inv.service || []).map((sv: any, i: number) => {
    const srv = sv.service_id || {};
    return {
      srNo: i + 1,
      // Fall back to the free-text service_name when no service was picked.
      name: txt(srv.serviceName || sv.service_name),
      description: srv.description || "",
      sac: NA,
      quantity: qty(sv.quantity),
      rate: money(sv.rate, cur),
      discount: money(sv.discount, cur),
      gst: money(sv.tax, cur),
      amount: money(sv.amount, cur),
    };
  });

  return {
    docTitle: cfg.title,
    billLabel: cfg.billLabel,
    currency: cur,
    // Free-text document sub-title (empty string when unset, so renderers can
    // hide the row instead of printing a placeholder).
    subTitle: (inv.sub_title ?? "").toString().trim(),
    invoiceNumber: txt(inv.invoice_number),
    poNumber: txt(inv.po),
    date: fmtDate(inv.date),
    dueDate: fmtDate(inv.due_date),
    total: money(inv.total, cur),
    outstanding: money(inv.balance_amount ?? inv.total, cur),
    company,
    billTo,
    shipTo: { address: docAddress(inv.shipping_address), shippingMethod: txt(inv.shipping_method) },
    products,
    services,
    summary: {
      subTotal: num(inv.sub_total),
      // `discount` is the order-level percentage; discountAmount is what it
      // works out to on the sub total (what the row should actually print).
      discountPercent: num(inv.discount),
      discountAmount: (num(inv.sub_total) * num(inv.discount)) / 100,
      inlineDiscount: num(inv.inline_discount),
      shippingCost: num(inv.shipping_cost),
      deposit: num(inv.deposit),
      depositDue: num(inv.deposit),
      tax: num(inv.tax),
      // Named-tax rows (name / rate / base / amount) computed by the client.
      taxBreakdown: Array.isArray(inv.tax_breakdown)
        ? inv.tax_breakdown.map((t: any) => ({
            name: txt(t?.name),
            rate: num(t?.rate),
            base: num(t?.base),
            amount: num(t?.amount),
          }))
        : [],
      total: num(inv.total),
      amountPaid: num(inv.paid_amount),
      returnOrder: 0,
      amountDue: num(inv.balance_amount ?? inv.total),
    },
    termsAndConditions: txt(inv.terms_and_conditions),
    notes: txt(inv.notes),
    hsnSacSummary: [],
    // Company image → Authorized Signatory. Document `inv.signature` is the
    // optional customer signature (shown only when PDF setting contact_sign is on).
    signature: {
      companyName: company.name,
      subtitle: "Authorized Signatory",
      companyImage: companySig?.image || null,
      image: inv.signature || null,
      customerImage: inv.signature || null,
    },
    // Scanning the QR opens the document as a PDF, scoped to the owning account
    // and addressed by its human number, e.g. https://temp-api.ssh.bd/<user_id>/invoice/16.
    // The tenant segment is the document's user_id (what it's stored under) so the
    // public route below can resolve it without auth. Base overridable via QR_BASE_URL.
    qrCodeData: `${process.env.QR_BASE_URL || "https://temp-api.ssh.bd"}/${String(user?._id ?? "")}/${String(type).toLowerCase().replace(/_/g, "-")}/${encodeURIComponent(String(inv.invoice_number || inv._id))}`,
    paymentDetails,
    paymentSummary,
    paymentMethods,
  };
};

// Back-compat alias.
export const resolveInvoiceData = (id: string | undefined, user: any) => resolveSalesDoc("Invoice", id, user);
