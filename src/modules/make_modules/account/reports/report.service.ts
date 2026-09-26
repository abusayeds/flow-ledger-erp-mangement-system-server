import { UserModel } from "../../../basic_modules/user/user.model";
import { role, CUSTOMER_ROLE_SET, VENDOR_ROLE_SET } from "../../../../utils/role";
import { partyBaseFilter } from "../../../../utils/partyUser";
import { companyObjectId } from "../account.utils";
import { InvoiceModel } from "../../invoice/invoice.model";
import { PurchaseInvoiceModel } from "../../purchase/purchaseInvoice/purchaseInvoice.model";
import { CreditNoteModel } from "../../creditNote/creditNote.model";
import { DebitNoteModel } from "../../debitNote/debitNote.model";
import { CustomerPaymentModel } from "../customerPayment/customerPayment.model";
import { VendorPaymentModel } from "../vendorPayment/vendorPayment.model";
import { BillModel } from "../../bill/bill.model";
import { ExpensesModel } from "../../expenses/expenses.model";
import { EstimateModel } from "../../estimate/estimate.model";
import { ProformaInvoiceModel } from "../../proformaInvoice/proformaInvoice.model";
import { TimeLogModel } from "../../timeLog/timeLog.model";
import { ProductModel } from "../../product/product.model";

const AGING_STATUSES = ["Open", "Partial", "Overdue"];
const BALANCE_STATUSES = ["Open", "Partial", "Paid", "Overdue"];

// Purchase invoices use lowercase states; "posted" is the open/payable one.
const PI_AGING_STATUSES = ["posted", "partial", "overdue"];
const PI_BALANCE_STATUSES = ["posted", "partial", "paid", "overdue"];

/** Outstanding balance of a purchase invoice. */
const resolvePIBalance = (doc: {
  total?: number;
  paid_amount?: number;
  balance_amount?: number;
}) => {
  if (doc.balance_amount !== undefined && doc.balance_amount !== null) {
    return doc.balance_amount;
  }
  return (doc.total ?? 0) - (doc.paid_amount ?? 0);
};

type AgingBucket = "current" | "1_30_days" | "31_60_days" | "61_90_days" | "over_90_days";

const bucketForDays = (days: number): AgingBucket => {
  if (days <= 0) return "current";
  if (days <= 30) return "1_30_days";
  if (days <= 60) return "31_60_days";
  if (days <= 90) return "61_90_days";
  return "over_90_days";
};

const emptyAging = () => ({
  current: 0,
  "1_30_days": 0,
  "31_60_days": 0,
  "61_90_days": 0,
  over_90_days: 0,
  total: 0,
});

const resolveBalance = (doc: { total?: number; paid_amount?: number; balance_amount?: number }) => {
  if (doc.balance_amount !== undefined && doc.balance_amount !== null) {
    return doc.balance_amount;
  }
  return (doc.total ?? 0) - (doc.paid_amount ?? 0);
};

const invoiceAgingDB = async (userId: string, asOfDate: string) => {
  const asOf = new Date(asOfDate);
  const invoices = await InvoiceModel.find({
    user_id: userId,
    isDeleted: false,
    status: { $in: AGING_STATUSES },
  })
    .populate("customer_id", "name email")
    .lean();
  const aging = emptyAging();
  const customerMap: Record<
    string,
    {
      customer_name: string;
      current: number;
      "1_30_days": number;
      "31_60_days": number;
      "61_90_days": number;
      over_90_days: number;
      total: number;
    }
  > = {};

  for (const inv of invoices) {
    const balance = resolveBalance(inv);
    if (balance <= 0) continue;

    const due = inv.due_date ? new Date(inv.due_date) : asOf;
    const days = Math.floor((asOf.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    const bucket = bucketForDays(days);

    aging[bucket] += balance;
    aging.total += balance;

    const customerId = String(inv.customer_id?._id ?? inv.customer_id ?? "unknown");
    const customerName =
      (inv.customer_id as { name?: string })?.name ?? "Unknown";

    if (!customerMap[customerId]) {
      customerMap[customerId] = {
        customer_name: customerName,
        current: 0,
        "1_30_days": 0,
        "31_60_days": 0,
        "61_90_days": 0,
        over_90_days: 0,
        total: 0,
      };
    }
    customerMap[customerId][bucket] += balance;
    customerMap[customerId].total += balance;
  }

  return {
    aging_summary: aging,
    customers: Object.values(customerMap),
    as_of_date: asOfDate,
  };
};

const billAgingDB = async (userId: string, asOfDate: string) => {
  const asOf = new Date(asOfDate);
  const bills = await PurchaseInvoiceModel.find({
    user_id: userId,
    isDeleted: false,
    status: { $in: PI_AGING_STATUSES },
  })
    .populate("vendor_id", "name email")
    .lean();

  const aging = emptyAging();
  const vendorMap: Record<
    string,
    {
      vendor_name: string;
      current: number;
      "1_30_days": number;
      "31_60_days": number;
      "61_90_days": number;
      over_90_days: number;
      total: number;
    }
  > = {};

  for (const bill of bills) {
    const balance = resolvePIBalance(bill);
    if (balance <= 0) continue;

    const due = bill.due_date ? new Date(bill.due_date) : asOf;
    const days = Math.floor((asOf.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    const bucket = bucketForDays(days);

    aging[bucket] += balance;
    aging.total += balance;

    const vendorId = String(bill.vendor_id?._id ?? bill.vendor_id ?? "unknown");
    const vendorName = (bill.vendor_id as { name?: string })?.name ?? "Unknown";

    if (!vendorMap[vendorId]) {
      vendorMap[vendorId] = {
        vendor_name: vendorName,
        current: 0,
        "1_30_days": 0,
        "31_60_days": 0,
        "61_90_days": 0,
        over_90_days: 0,
        total: 0,
      };
    }
    vendorMap[vendorId][bucket] += balance;
    vendorMap[vendorId].total += balance;
  }

  return {
    aging_summary: aging,
    vendors: Object.values(vendorMap),
    as_of_date: asOfDate,
  };
};

const taxSummaryDB = async (userId: string, fromDate: string, toDate: string) => {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999);

  const invoiceMatch = {
    user_id: companyObjectId(userId),
    isDeleted: false,
    status: { $in: BALANCE_STATUSES },
    date: { $gte: from, $lte: to },
  };

  const billMatch = {
    user_id: companyObjectId(userId),
    isDeleted: false,
    status: { $in: PI_BALANCE_STATUSES },
    date: { $gte: from, $lte: to },
  };

  const [collectedAgg, paidAgg] = await Promise.all([
    InvoiceModel.aggregate([
      { $match: invoiceMatch },
      { $group: { _id: null, total: { $sum: "$tax" } } },
    ]),
    PurchaseInvoiceModel.aggregate([
      { $match: billMatch },
      { $group: { _id: null, total: { $sum: "$tax" } } },
    ]),
  ]);

  const totalCollected = collectedAgg[0]?.total ?? 0;
  const totalPaid = paidAgg[0]?.total ?? 0;

  return {
    tax_collected: {
      items: [{ tax_name: "Sales tax (aggregate)", amount: totalCollected }],
      total: totalCollected,
    },
    tax_paid: {
      items: [{ tax_name: "Purchase tax (aggregate)", amount: totalPaid }],
      total: totalPaid,
    },
    net_tax_liability: totalCollected - totalPaid,
    from_date: fromDate,
    to_date: toDate,
  };
};

const customerBalanceDB = async (
  userId: string,
  asOfDate: string,
  showZeroBalances: boolean
) => {
  const asOf = new Date(asOfDate);
  asOf.setHours(23, 59, 59, 999);
  const companyId = companyObjectId(userId);

  const customers = await UserModel.find(partyBaseFilter(companyId, role.customer))
    .select("_id name email")
    .lean();

  const balances: Array<{
    customer_id: string;
    customer_name: string;
    customer_email?: string;
    total_invoiced: number;
    total_returns: number;
    net_invoiced: number;
    total_paid: number;
    balance: number;
  }> = [];

  let totalBalance = 0;

  for (const customer of customers) {
    const invoices = await InvoiceModel.find({
      user_id: userId,
      customer_id: customer._id,
      isDeleted: false,
      status: { $in: BALANCE_STATUSES },
      date: { $lte: asOf },
    }).lean();

    const invoiced = invoices.reduce((s, i) => s + (i.total ?? 0), 0);
    const balance = invoices.reduce((s, i) => s + resolveBalance(i), 0);
    const paid = invoiced - balance;

    if (!showZeroBalances && Math.abs(balance) < 0.01) continue;

    balances.push({
      customer_id: String(customer._id),
      customer_name: customer.name ?? "",
      customer_email: customer.email,
      total_invoiced: invoiced,
      total_returns: 0,
      net_invoiced: invoiced,
      total_paid: paid,
      balance,
    });
    totalBalance += balance;
  }

  balances.sort((a, b) => b.balance - a.balance);

  return { customers: balances, total_balance: totalBalance, as_of_date: asOfDate };
};

const vendorBalanceDB = async (
  userId: string,
  asOfDate: string,
  showZeroBalances: boolean
) => {
  const asOf = new Date(asOfDate);
  asOf.setHours(23, 59, 59, 999);
  const companyId = companyObjectId(userId);

  const vendors = await UserModel.find(partyBaseFilter(companyId, role.vendor))
    .select("_id name email")
    .lean();

  const balances: Array<{
    vendor_id: string;
    vendor_name: string;
    vendor_email?: string;
    total_billed: number;
    total_returns: number;
    net_billed: number;
    total_paid: number;
    balance: number;
  }> = [];

  let totalBalance = 0;

  for (const vendor of vendors) {
    const bills = await PurchaseInvoiceModel.find({
      user_id: userId,
      vendor_id: vendor._id,
      isDeleted: false,
      status: { $in: PI_BALANCE_STATUSES },
      date: { $lte: asOf },
    }).lean();

    const billed = bills.reduce((s, b) => s + (b.total ?? 0), 0);
    const balance = bills.reduce((s, b) => s + resolvePIBalance(b), 0);
    const paid = billed - balance;

    if (!showZeroBalances && Math.abs(balance) < 0.01) continue;

    balances.push({
      vendor_id: String(vendor._id),
      vendor_name: vendor.name ?? "",
      vendor_email: vendor.email,
      total_billed: billed,
      total_returns: 0,
      net_billed: billed,
      total_paid: paid,
      balance,
    });
    totalBalance += balance;
  }

  balances.sort((a, b) => b.balance - a.balance);

  return { vendors: balances, total_balance: totalBalance, as_of_date: asOfDate };
};

const customerDetailDB = async (
  userId: string,
  customerId: string,
  startDate?: string,
  endDate?: string
) => {
  const customer = await UserModel.findOne({
    _id: customerId,
    companyId: companyObjectId(userId),
    role: { $in: [...CUSTOMER_ROLE_SET] },
    isDeleted: false,
  })
    .select("_id name email")
    .lean();

  if (!customer) return null;

  const customerInfo = customer as { _id: unknown; name?: string; email?: string };

  const invoiceFilter: Record<string, unknown> = {
    user_id: userId,
    customer_id: customerId,
    isDeleted: false,
    status: { $in: BALANCE_STATUSES },
  };
  if (startDate) invoiceFilter.date = { ...(invoiceFilter.date as object), $gte: new Date(startDate) };
  if (endDate) {
    invoiceFilter.date = {
      ...(invoiceFilter.date as Record<string, unknown>),
      $lte: new Date(endDate),
    };
  }

  const invoices = await InvoiceModel.find(invoiceFilter)
    .select("invoice_number date due_date sub_total tax total balance_amount status paid_amount")
    .sort({ date: -1 })
    .lean();

  const cnFilter: Record<string, unknown> = {
    user_id: userId,
    customer_id: customerId,
    isDeleted: false,
    status: { $in: ["Approved", "Partial", "Applied", "Open"] },
  };
  if (startDate) cnFilter.date = { $gte: new Date(startDate) };
  if (endDate) cnFilter.date = { ...(cnFilter.date as object), $lte: new Date(endDate) };

  const creditNotes = await CreditNoteModel.find(cnFilter)
    .select("invoice_number date total applied_amount balance_amount status")
    .sort({ date: -1 })
    .lean();

  const payFilter: Record<string, unknown> = {
    user_id: userId,
    customer_id: customerId,
    isDeleted: false,
  };
  if (startDate) payFilter.payment_date = { $gte: new Date(startDate) };
  if (endDate) {
    payFilter.payment_date = {
      ...(payFilter.payment_date as Record<string, unknown>),
      $lte: new Date(endDate),
    };
  }

  const payments = await CustomerPaymentModel.find(payFilter)
    .populate("bank_account_id", "account_name")
    .select("payment_number payment_date payment_amount reference_number status bank_account_id")
    .sort({ payment_date: -1 })
    .lean();

  const paymentsMapped = payments.map((p) => ({
    payment_number: p.payment_number,
    date: p.payment_date,
    amount: p.payment_amount,
    reference_number: p.reference_number,
    status: p.status,
    bank_account: (p.bank_account_id as { account_name?: string })?.account_name,
  }));

  return {
    customer: {
      _id: customerInfo._id,
      name: customerInfo.name,
      email: customerInfo.email,
    },
    date_range: { start_date: startDate ?? null, end_date: endDate ?? null },
    invoices: invoices.map((i) => ({
      invoice_number: i.invoice_number,
      date: i.date,
      due_date: i.due_date,
      subtotal: i.sub_total,
      tax_amount: i.tax,
      total_amount: i.total,
      balance_amount: resolveBalance(i),
      status: i.status,
    })),
    returns: [],
    credit_notes: creditNotes.map((c) => ({
      credit_note_number: c.invoice_number,
      date: c.date,
      total_amount: c.total,
      applied_amount: c.applied_amount,
      balance_amount: c.balance_amount,
      status: c.status,
    })),
    payments: paymentsMapped,
    summary: {
      total_invoiced: invoices.reduce((s, i) => s + (i.total ?? 0), 0),
      total_returns: 0,
      total_credit_notes: creditNotes.reduce((s, c) => s + (c.total ?? 0), 0),
      total_payments: payments.reduce((s, p) => s + (p.payment_amount ?? 0), 0),
      balance: invoices.reduce((s, i) => s + resolveBalance(i), 0),
    },
  };
};

const vendorDetailDB = async (
  userId: string,
  vendorId: string,
  startDate?: string,
  endDate?: string
) => {
  const vendor = await UserModel.findOne({
    _id: vendorId,
    companyId: companyObjectId(userId),
    role: { $in: [...VENDOR_ROLE_SET] },
    isDeleted: false,
  })
    .select("_id name email")
    .lean();

  if (!vendor) return null;

  const vendorInfo = vendor as { _id: unknown; name?: string; email?: string };

  const billFilter: Record<string, unknown> = {
    user_id: userId,
    vendor_id: vendorId,
    isDeleted: false,
    status: { $in: PI_BALANCE_STATUSES },
  };
  if (startDate) billFilter.date = { $gte: new Date(startDate) };
  if (endDate)
    billFilter.date = { ...(billFilter.date as object), $lte: new Date(endDate) };

  const bills = await PurchaseInvoiceModel.find(billFilter)
    .select(
      "invoice_number date due_date sub_total tax total balance_amount status paid_amount"
    )
    .sort({ date: -1 })
    .lean();

  const dnFilter: Record<string, unknown> = {
    user_id: userId,
    vendor_id: vendorId,
    isDeleted: false,
    status: { $in: ["Approved", "Partial", "Applied", "Open"] },
  };
  if (startDate) dnFilter.date = { $gte: new Date(startDate) };
  if (endDate) dnFilter.date = { ...(dnFilter.date as object), $lte: new Date(endDate) };

  const debitNotes = await DebitNoteModel.find(dnFilter)
    .select("invoice_number date total applied_amount balance_amount status")
    .sort({ date: -1 })
    .lean();

  const payFilter: Record<string, unknown> = {
    user_id: userId,
    vendor_id: vendorId,
    isDeleted: false,
  };
  if (startDate) payFilter.payment_date = { $gte: new Date(startDate) };
  if (endDate) {
    payFilter.payment_date = {
      ...(payFilter.payment_date as Record<string, unknown>),
      $lte: new Date(endDate),
    };
  }

  const payments = await VendorPaymentModel.find(payFilter)
    .populate("bank_account_id", "account_name")
    .select("payment_number payment_date payment_amount reference_number status bank_account_id")
    .sort({ payment_date: -1 })
    .lean();

  const paymentsMapped = payments.map((p) => ({
    payment_number: p.payment_number,
    date: p.payment_date,
    amount: p.payment_amount,
    reference_number: p.reference_number,
    status: p.status,
    bank_account: (p.bank_account_id as { account_name?: string })?.account_name,
  }));

  return {
    vendor: { _id: vendorInfo._id, name: vendorInfo.name, email: vendorInfo.email },
    date_range: { start_date: startDate ?? null, end_date: endDate ?? null },
    invoices: bills.map((b) => ({
      invoice_number: b.invoice_number,
      date: b.date,
      due_date: b.due_date,
      subtotal: b.sub_total,
      tax_amount: b.tax,
      total_amount: b.total,
      balance_amount: resolvePIBalance(b),
      status: b.status,
    })),
    returns: [],
    debit_notes: debitNotes.map((d) => ({
      debit_note_number: d.invoice_number,
      date: d.date,
      total_amount: d.total,
      applied_amount: d.applied_amount,
      balance_amount: d.balance_amount,
      status: d.status,
    })),
    payments: paymentsMapped,
    summary: {
      total_invoiced: bills.reduce((s, b) => s + (b.total ?? 0), 0),
      total_returns: 0,
      total_debit_notes: debitNotes.reduce((s, d) => s + (d.total ?? 0), 0),
      total_payments: payments.reduce((s, p) => s + (p.payment_amount ?? 0), 0),
      balance: bills.reduce((s, b) => s + resolvePIBalance(b), 0),
    },
  };
};

/* eslint-disable @typescript-eslint/no-explicit-any */
// Company-wide financial summary for the Summary Report screen. Every figure is
// summed defensively so a missing model/field yields 0 rather than a 500.
const summaryDB = async (userId: string) => {
  const uid = companyObjectId(userId);
  const now = new Date();

  const sumOf = async (Model: any, field: string, extra: any = {}) => {
    try {
      const r = await Model.aggregate([
        { $match: { user_id: uid, ...extra } },
        { $group: { _id: null, s: { $sum: `$${field}` } } },
      ]);
      return r[0]?.s || 0;
    } catch {
      return 0;
    }
  };

  const groupTop = async (Model: any, nameField: string, valueField: string) => {
    try {
      const rows = await Model.aggregate([
        { $match: { user_id: uid } },
        { $group: { _id: `$${nameField}`, value: { $sum: `$${valueField}` } } },
        { $sort: { value: -1 } },
        { $limit: 5 },
      ]);
      return rows
        .filter((x: any) => x._id)
        .map((x: any) => ({ name: String(x._id), value: x.value || 0 }));
    } catch {
      return [];
    }
  };

  const [
    sales, outstanding, overdue, bills, expenses, estimates, proforma,
    creditNotes, debitNotes, paymentReceived, purchaseOrders,
    salesTax, salesDiscount, salesSubTotal, timeLogHours,
  ] = await Promise.all([
    sumOf(InvoiceModel, "total"),
    sumOf(InvoiceModel, "balance_amount"),
    sumOf(InvoiceModel, "balance_amount", { due_date: { $lt: now } }),
    sumOf(BillModel, "total"),
    sumOf(ExpensesModel, "total"),
    sumOf(EstimateModel, "total"),
    sumOf(ProformaInvoiceModel, "total"),
    sumOf(CreditNoteModel, "total"),
    sumOf(DebitNoteModel, "total"),
    sumOf(CustomerPaymentModel, "payment_amount"),
    sumOf(PurchaseInvoiceModel, "total"),
    sumOf(InvoiceModel, "tax"),
    sumOf(InvoiceModel, "discount"),
    sumOf(InvoiceModel, "sub_total"),
    sumOf(TimeLogModel, "hours"),
  ]);

  const [topCustomers, topVendors] = await Promise.all([
    groupTop(InvoiceModel, "customer_name", "total"),
    groupTop(BillModel, "vendor_name", "total"),
  ]);

  return {
    summary: {
      outstanding,
      net_profit: sales - expenses,
      sales,
      bills,
      payment_received: paymentReceived,
      proforma_invoice: proforma,
      estimates,
      expenses,
      purchase_order: purchaseOrders,
      overdue,
      credit_notes: creditNotes,
      debit_notes: debitNotes,
      time_logs: timeLogHours,
    },
    top_customers: topCustomers,
    top_vendors: topVendors,
    sales_breakdown: {
      total: sales,
      discount: salesDiscount,
      net_sales: sales - salesDiscount,
      tax: salesTax,
      gross_sales: salesSubTotal,
    },
    payment_received_breakdown: [{ name: "Total", value: paymentReceived }],
  };
};

/**
 * Generic document-list report. Returns pre-shaped `{ columns, rows }` so the
 * client can render any of these reports without per-type mapping.
 */
const listReportDB = async (userId: string, type: string) => {
  const uid = companyObjectId(userId);
  const scope = { user_id: uid, isDeleted: { $ne: true } };
  const money = (n: unknown) => Number(n ?? 0);
  const dateStr = (d: unknown) =>
    d ? new Date(d as Date).toISOString().slice(0, 10) : "";

  // Sales-style docs: number / party / date / total / status.
  const docReport = async (
    Model: any,
    partyField: "customer_name" | "vendor_name",
    partyLabel: string,
    title: string
  ) => {
    const rows = await Model.find(scope)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    return {
      title,
      columns: [
        { id: "number", label: "Number" },
        { id: "party", label: partyLabel },
        { id: "date", label: "Date" },
        { id: "total", label: "Total" },
        { id: "status", label: "Status" },
      ],
      rows: rows.map((r: any) => ({
        number: r.invoice_number ?? r.po ?? "",
        party: r[partyField] ?? "",
        date: dateStr(r.date ?? r.createdAt),
        total: money(r.total),
        status: r.status ?? "",
      })),
    };
  };

  switch (type) {
    case "sales":
      return docReport(InvoiceModel, "customer_name", "Customer", "Sales Report");
    case "estimate":
      return docReport(EstimateModel, "customer_name", "Customer", "Estimate Report");
    case "bill":
      return docReport(BillModel, "vendor_name", "Vendor", "Bill Report");
    case "purchase_order":
      return docReport(PurchaseInvoiceModel, "vendor_name", "Vendor", "Purchase Order Report");
    case "expense": {
      const rows = await ExpensesModel.find(scope).sort({ createdAt: -1 }).limit(500).lean();
      return {
        title: "Expense Report",
        columns: [
          { id: "number", label: "Number" },
          { id: "category", label: "Category" },
          { id: "date", label: "Date" },
          { id: "total", label: "Total" },
        ],
        rows: rows.map((r: any) => ({
          number: r.invoice_number ?? "",
          category: r.category ?? "",
          date: dateStr(r.date ?? r.createdAt),
          total: money(r.total),
        })),
      };
    }
    case "payment":
    case "payment_made": {
      const Model: any = type === "payment" ? CustomerPaymentModel : VendorPaymentModel;
      const rows = await Model.find(scope).sort({ createdAt: -1 }).limit(500).lean();
      return {
        title: type === "payment" ? "Payment Report" : "Payment Made",
        columns: [
          { id: "number", label: "Number" },
          { id: "reference", label: "Reference" },
          { id: "date", label: "Date" },
          { id: "amount", label: "Amount" },
        ],
        rows: rows.map((r: any) => ({
          number: r.payment_number ?? "",
          reference: r.reference_number ?? "",
          date: dateStr(r.payment_date ?? r.createdAt),
          amount: money(r.payment_amount),
        })),
      };
    }
    case "stock": {
      const rows = await ProductModel.find({ user_id: uid, isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(1000)
        .lean();
      return {
        title: "Stock Report",
        columns: [
          { id: "product", label: "Product" },
          { id: "quantity", label: "Quantity" },
          { id: "buy_price", label: "Buy Price" },
          { id: "sell_price", label: "Sell Price" },
        ],
        rows: rows.map((r: any) => ({
          product: r.productName ?? "",
          quantity: money(r.stock?.quantity ?? r.quantity),
          buy_price: money(r.pricing?.buyPrice),
          sell_price: money(r.pricing?.sellPrice),
        })),
      };
    }
    default:
      return { title: "Report", columns: [], rows: [] };
  }
};

export const reportService = {
  invoiceAgingDB,
  billAgingDB,
  taxSummaryDB,
  customerBalanceDB,
  vendorBalanceDB,
  customerDetailDB,
  vendorDetailDB,
  summaryDB,
  listReportDB,
};
