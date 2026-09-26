/** Activity module keys — one per feature entity type. */
export const ActivityModule = {
  product: "product",
  service: "service",
  customer: "customer",
  vendor: "vendor",
  category: "category",
  tax: "tax",
  estimate: "estimate",
  invoice: "invoice",
  bill: "bill",
  quotation: "quotation",
  proposal: "proposal",
  proforma_invoice: "proforma_invoice",
  delivery_challan: "delivery_challan",
  sales_receipt: "sales_receipt",
  expenses: "expenses",
  credit_note: "credit_note",
  debit_note: "debit_note",
  payment: "payment",
  payment_received: "payment_received",
  project: "project",
  warehouse_transfer: "warehouse_transfer",
  invoice_return: "invoice_return",
  edit_titles: "edit_titles",
  pdf_setting: "pdf_setting",
  app_setting: "app_setting",
  account_credit_note: "account_credit_note",
  account_debit_note: "account_debit_note",
} as const;

export type TActivityModule = (typeof ActivityModule)[keyof typeof ActivityModule];

export const ACTIVITY_MODULE_VALUES = Object.values(ActivityModule);
