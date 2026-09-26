import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../errors/AppError";
import { CreditNoteModel } from "../creditNote/creditNote.model";
import { DebitNoteModel } from "../debitNote/debitNote.model";
import { creditNoteService } from "../creditNote/creditNote.service";
import { debitNoteService } from "../debitNote/debitNote.service";
import { InvoiceModel } from "../invoice/invoice.model";
import { TInvoiceReturn } from "../invoice/invoiceReturn/invoiceReturn.interface";
import { TPurchaseReturn } from "../purchase/purchaseReturn/purchaseReturn.interface";
import { TCreditNote } from "../creditNote/creditNote.interface";
import { TDebitNote } from "../debitNote/debitNote.interface";

export const buildNoteNumber = (prefix: string) => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${prefix}-${y}${m}${day}-${String(d.getTime()).slice(-4)}`;
};

/** Laravel: ApproveSalesReturn → CreateCreditNoteFromReturn (draft credit note). */
export const createCreditNoteFromInvoiceReturn = async (
  userId: string,
  salesReturn: TInvoiceReturn & { _id: Types.ObjectId }
) => {
  const existing = await CreditNoteModel.findOne({
    user_id: userId,
    return_id: salesReturn._id,
    isDeleted: false,
  });
  if (existing) {
    throw new AppError(httpStatus.CONFLICT, "Credit note already exists for this sales return");
  }

  const invoice = await InvoiceModel.findOne({
    _id: salesReturn.invoice_id,
    user_id: userId,
    isDeleted: false,
  });
  if (!invoice) {
    throw new AppError(httpStatus.NOT_FOUND, "Original invoice not found for this return");
  }
  if (!invoice.customer_id) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invoice has no customer; cannot create credit note");
  }

  const payload: Partial<TCreditNote> = {
    user_id: new Types.ObjectId(userId),
    customer_id: invoice.customer_id,
    source: "return",
    return_id: salesReturn._id,
    source_invoice_id: invoice._id,
    return_reason: salesReturn.return_reason,
    invoice_number: buildNoteNumber("CN"),
    currency: invoice.currency,
    date: salesReturn.return_date ?? new Date(),
    product: invoice.product ? [...invoice.product] as any : undefined,
    service: invoice.service ? [...invoice.service] as any : undefined,
    billing_address: invoice.billing_address,
    shipping_address: invoice.shipping_address,
    sub_total: invoice.sub_total,
    discount: invoice.discount,
    shipping_cost: invoice.shipping_cost,
    inline_discount: invoice.inline_discount,
    tax: invoice.tax,
    total: invoice.total,
    status: "Draft",
    notes: salesReturn.notes,
    internal_notes: `Auto-created from sales return: ${salesReturn.return_reason}`,
    applied_amount: 0,
    balance_amount: invoice.total ?? 0,
  };

  return creditNoteService.createDB(payload as TCreditNote);
};

/** Laravel: ApprovePurchaseReturn → CreateDebitNoteFromReturn (draft debit note). */
export const createDebitNoteFromPurchaseReturn = async (
  userId: string,
  purchaseReturn: TPurchaseReturn & { _id: Types.ObjectId }
) => {
  const existing = await DebitNoteModel.findOne({
    user_id: userId,
    return_id: purchaseReturn._id,
    isDeleted: false,
  });
  if (existing) {
    throw new AppError(httpStatus.CONFLICT, "Debit note already exists for this purchase return");
  }

  const vendor_id = purchaseReturn.vendor_id;
  if (!vendor_id) {
    throw new AppError(httpStatus.BAD_REQUEST, "Purchase return has no vendor; cannot create debit note");
  }

  // Map the purchase-return line items onto the debit note's product lines.
  const product = (purchaseReturn.items || []).map((it) => ({
    product_id: it.product_id,
    quantity: it.return_quantity,
    rate: it.unit_price,
    tax: it.tax_percentage ?? 0,
    discount: it.discount_percentage ?? 0,
    amount: it.total_amount ?? 0,
  }));

  const payload: Partial<TDebitNote> = {
    user_id: new Types.ObjectId(userId),
    vendor_id,
    source: "return",
    return_id: purchaseReturn._id,
    source_invoice_id: purchaseReturn.original_invoice_id,
    return_reason: purchaseReturn.reason,
    invoice_number: buildNoteNumber("DN"),
    date: purchaseReturn.return_date ?? new Date(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    product: product as any,
    sub_total: purchaseReturn.subtotal,
    discount: purchaseReturn.discount_amount,
    tax: purchaseReturn.tax_amount,
    total: purchaseReturn.total_amount,
    status: "Draft",
    notes: purchaseReturn.notes,
    internal_notes: `Auto-created from purchase return: ${purchaseReturn.reason}`,
    applied_amount: 0,
    balance_amount: purchaseReturn.total_amount ?? 0,
  };

  return debitNoteService.createDB(payload as TDebitNote);
};
