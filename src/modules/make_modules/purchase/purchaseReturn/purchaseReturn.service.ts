import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../../errors/AppError";
import queryBuilder, { buildSoftDeleteFilter } from "../../../../builder/queryBuilder";
import { PurchaseReturnModel } from "./purchaseReturn.model";
import { PurchaseInvoiceModel } from "../purchaseInvoice/purchaseInvoice.model";
import { WarehouseModel } from "../warehouse/warehouse.model";
import { computeTotals, generateDocNumber, RawItem } from "../purchase.utils";
import { createDebitNoteFromPurchaseReturn } from "../../account/noteFromReturn.service";
import { withBulkDeleteIdSecond } from "../../../../utils/bulkDelete";

const POPULATE = [
  { path: "vendor_id", select: "name email" },
  { path: "warehouse_id", select: "name city" },
  { path: "original_invoice_id", select: "invoice_number total status" },
  { path: "items.product_id", select: "productName sku" },
];

const createDB = async (userId: string, body: Record<string, unknown>) => {
  if (!body.original_invoice_id || !Types.ObjectId.isValid(String(body.original_invoice_id))) {
    throw new AppError(httpStatus.BAD_REQUEST, "Valid original invoice is required");
  }
  const originalInvoice = await PurchaseInvoiceModel.findOne({
    _id: body.original_invoice_id,
    user_id: userId,
    isDeleted: false,
  });
  if (!originalInvoice) {
    throw new AppError(httpStatus.NOT_FOUND, "Original purchase invoice not found");
  }
  if (originalInvoice.status === "draft") {
    throw new AppError(httpStatus.BAD_REQUEST, "Cannot return against a draft invoice");
  }

  if (body.warehouse_id) {
    const wh = await WarehouseModel.findOne({ _id: body.warehouse_id, user_id: userId, isDeleted: false });
    if (!wh) throw new AppError(httpStatus.BAD_REQUEST, "Warehouse not found in your company");
  }

  const rawItems = (body.items as RawItem[]) || [];
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "At least one return item is required");
  }

  // Pull discount/tax from the matching original purchase invoice product line.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const origItems = ((originalInvoice.product as any[]) || []);
  const origMap = new Map(origItems.map((it) => [String(it._id), it]));
  const enriched = rawItems.map((it) => {
    const orig = it.original_invoice_item_id ? origMap.get(String(it.original_invoice_item_id)) : undefined;
    return {
      ...it,
      unit_price: Number(it.unit_price ?? orig?.rate ?? 0),
      discount_percentage: Number(orig?.discount ?? it.discount_percentage ?? 0),
      tax_percentage: Number(orig?.tax ?? it.tax_percentage ?? 0),
      original_quantity: Number(orig?.quantity ?? it.original_quantity ?? 0),
    };
  });

  const totals = computeTotals(enriched, "return_quantity");
  const return_number = await generateDocNumber(PurchaseReturnModel, userId, "PR", "return_number");

  const created = await PurchaseReturnModel.create({
    return_number,
    return_date: body.return_date,
    vendor_id: body.vendor_id ?? originalInvoice.vendor_id,
    warehouse_id: body.warehouse_id ?? originalInvoice.warehouse_id,
    original_invoice_id: originalInvoice._id,
    reason: body.reason,
    notes: body.notes,
    items: totals.items,
    subtotal: totals.subtotal,
    tax_amount: totals.tax_amount,
    discount_amount: totals.discount_amount,
    total_amount: totals.total_amount,
    status: "draft",
    user_id: new Types.ObjectId(userId),
    isDeleted: false,
  });
  return created.populate(POPULATE);
};

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  // `delete` here is a SOFT delete. isDeleted is NOT hard-coded: queryBuilder's
  // filter() applies buildSoftDeleteFilter, which defaults to active-only and
  // honours ?isDeleted=true for the Trash tab. Pinning it would override that.
  const base = { user_id: userId };
  const qb = new queryBuilder(PurchaseReturnModel.find(base).populate(POPULATE), query)
    .search(["return_number", "notes"])
    .filter()
    .sort()
    .fields();
  // The count must use the same soft-delete rule, or the Trash tab paginates
  // against the active total.
  const { totalData } = await qb.paginate(
    PurchaseReturnModel.find({ ...base, ...buildSoftDeleteFilter(query) })
  );
  const data = await qb.modelQuery.exec();
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query?.limit) || 10;
  const pagination = qb.calculatePagination({ totalData, currentPage, limit });
  return { data, pagination };
};

const getSingleDB = async (userId: string, id: string) => {
  const doc = await PurchaseReturnModel.findOne({ _id: id, user_id: userId, isDeleted: false }).populate(POPULATE);
  if (!doc) throw new AppError(httpStatus.NOT_FOUND, "Purchase return not found");
  return doc;
};

/** Laravel approve(): only a draft return can be approved → auto draft debit note. */
const approveDB = async (userId: string, id: string) => {
  const purchaseReturn = await PurchaseReturnModel.findOne({ _id: id, user_id: userId, isDeleted: false });
  if (!purchaseReturn) throw new AppError(httpStatus.NOT_FOUND, "Purchase return not found");
  if (purchaseReturn.status !== "draft") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only draft returns can be approved");
  }

  const debitNote = await createDebitNoteFromPurchaseReturn(userId, purchaseReturn);
  purchaseReturn.status = "approved";
  purchaseReturn.debit_note_id = debitNote._id as Types.ObjectId;
  await purchaseReturn.save();
  return { purchaseReturn: await purchaseReturn.populate(POPULATE), debitNote };
};

/** Laravel complete(): only an approved return can be completed. */
const completeDB = async (userId: string, id: string) => {
  const purchaseReturn = await PurchaseReturnModel.findOne({ _id: id, user_id: userId, isDeleted: false });
  if (!purchaseReturn) throw new AppError(httpStatus.NOT_FOUND, "Purchase return not found");
  if (purchaseReturn.status !== "approved") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only approved returns can be completed");
  }
  purchaseReturn.status = "completed";
  await purchaseReturn.save();
  return purchaseReturn.populate(POPULATE);
};

/** Laravel destroy(): only a draft return can be deleted. */
const removeDBOne = async (userId: string, id: string) => {
  const purchaseReturn = await PurchaseReturnModel.findOne({ _id: id, user_id: userId, isDeleted: false });
  if (!purchaseReturn) throw new AppError(httpStatus.NOT_FOUND, "Purchase return not found");
  if (purchaseReturn.status !== "draft") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only draft returns can be deleted");
  }
  purchaseReturn.isDeleted = true;
  await purchaseReturn.save();
  return { _id: id };
};

const removeDB = withBulkDeleteIdSecond(removeDBOne);

/**
 * Edits a purchase return. The app's edit form changes header fields (vendor,
 * warehouse, reason, date, notes); it carries display names, so ids arrive only
 * when the user re-picked from a typeahead — every field is therefore optional
 * and only what's provided is written.
 *
 * `status`, `user_id`, `return_number` and `original_invoice_id` are never
 * client-controlled. Item edits are refused once the return is past draft: an
 * approved return has a debit note derived from its items, so changing them
 * would silently desync the two.
 */
const updateDB = async (userId: string, id: string, body: Record<string, unknown>) => {
  const existing = await PurchaseReturnModel.findOne({ _id: id, user_id: userId, isDeleted: false });
  if (!existing) throw new AppError(httpStatus.NOT_FOUND, "Purchase return not found");

  const update: Record<string, unknown> = {};

  if (body.return_date !== undefined) update.return_date = body.return_date;
  if (body.reason !== undefined) update.reason = body.reason;
  if (body.notes !== undefined) update.notes = body.notes;

  if (body.vendor_id) {
    if (!Types.ObjectId.isValid(String(body.vendor_id))) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid vendor id");
    }
    update.vendor_id = body.vendor_id;
  }

  if (body.warehouse_id) {
    const wh = await WarehouseModel.findOne({ _id: body.warehouse_id, user_id: userId, isDeleted: false });
    if (!wh) throw new AppError(httpStatus.BAD_REQUEST, "Warehouse not found in your company");
    update.warehouse_id = body.warehouse_id;
  }

  const rawItems = body.items as RawItem[] | undefined;
  if (Array.isArray(rawItems) && rawItems.length > 0) {
    if (existing.status !== "draft") {
      throw new AppError(httpStatus.BAD_REQUEST, "Items can only be changed while the return is a draft");
    }
    const originalInvoice = await PurchaseInvoiceModel.findOne({
      _id: existing.original_invoice_id,
      user_id: userId,
      isDeleted: false,
    });
    if (!originalInvoice) {
      throw new AppError(httpStatus.NOT_FOUND, "Original purchase invoice not found");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const origItems = ((originalInvoice.product as any[]) || []);
    const origMap = new Map(origItems.map((it) => [String(it._id), it]));
    const enriched = rawItems.map((it) => {
      const orig = it.original_invoice_item_id ? origMap.get(String(it.original_invoice_item_id)) : undefined;
      return {
        ...it,
        unit_price: Number(it.unit_price ?? orig?.rate ?? 0),
        discount_percentage: Number(orig?.discount ?? it.discount_percentage ?? 0),
        tax_percentage: Number(orig?.tax ?? it.tax_percentage ?? 0),
        original_quantity: Number(orig?.quantity ?? it.original_quantity ?? 0),
      };
    });
    const totals = computeTotals(enriched, "return_quantity");
    update.items = totals.items;
    update.subtotal = totals.subtotal;
    update.tax_amount = totals.tax_amount;
    update.discount_amount = totals.discount_amount;
    update.total_amount = totals.total_amount;
  }

  const updated = await PurchaseReturnModel.findOneAndUpdate(
    { _id: id, user_id: userId },
    update,
    { new: true, runValidators: true }
  ).populate(POPULATE);
  return updated;
};

/**
 * Sets a purchase return's status from the app's action menu, which treats
 * status as a free label (Draft / Approved / Completed / Processing / Trash)
 * rather than a strict workflow.
 *
 * `trash` is a soft delete (the app's Trash tab lists these, and [restoreDB]
 * brings them back). Any real status also clears `isDeleted`, so setting a
 * status is how a trashed row is restored. Moving to `approved` creates the
 * debit note the same way [approveDB] does — but idempotently, keyed on
 * `debit_note_id`, so re-approving never creates a duplicate.
 */
const STATUS_VALUES = ["draft", "approved", "completed", "processing", "cancelled"] as const;

const updateStatusDB = async (userId: string, id: string, statusRaw: unknown) => {
  const status = String(statusRaw ?? "").trim().toLowerCase();

  // Include isDeleted rows: setting a status is also how the app restores a
  // trashed return.
  const doc = await PurchaseReturnModel.findOne({ _id: id, user_id: userId });
  if (!doc) throw new AppError(httpStatus.NOT_FOUND, "Purchase return not found");

  if (status === "trash") {
    doc.isDeleted = true;
    await doc.save();
    return doc.populate(POPULATE);
  }

  if (!STATUS_VALUES.includes(status as (typeof STATUS_VALUES)[number])) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `status must be one of: ${STATUS_VALUES.join(", ")}, trash`
    );
  }

  // Approving materialises the debit note, once.
  if (status === "approved" && !doc.debit_note_id) {
    const debitNote = await createDebitNoteFromPurchaseReturn(userId, doc);
    doc.debit_note_id = debitNote._id as Types.ObjectId;
  }

  doc.status = status as (typeof STATUS_VALUES)[number];
  doc.isDeleted = false;
  await doc.save();
  return doc.populate(POPULATE);
};

/** Brings a trashed return back into the active list. */
const restoreDB = async (userId: string, id: string) => {
  const doc = await PurchaseReturnModel.findOneAndUpdate(
    { _id: id, user_id: userId, isDeleted: true },
    { isDeleted: false },
    { new: true }
  ).populate(POPULATE);
  if (!doc) throw new AppError(httpStatus.NOT_FOUND, "Purchase return not found in Trash");
  return doc;
};

export const purchaseReturnService = {
  createDB,
  getAllDB,
  getSingleDB,
  approveDB,
  completeDB,
  removeDB,
  updateDB,
  updateStatusDB,
  restoreDB,
};
