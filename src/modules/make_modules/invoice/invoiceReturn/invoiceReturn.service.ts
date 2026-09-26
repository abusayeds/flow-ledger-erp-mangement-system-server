import httpStatus from "http-status";
import { Model } from "mongoose";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { TInvoiceReturn } from "./invoiceReturn.interface";
import { InvoiceReturnModel } from "./invoiceReturn.model";
import { InvoiceModel } from "../invoice.model";
import { WarehouseModel } from "../../purchase/warehouse/warehouse.model";
import { createCreditNoteFromInvoiceReturn } from "../../account/noteFromReturn.service";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const createInvoiceReturnDB = async (payload: TInvoiceReturn) => {
  const invoice = await InvoiceModel.findById(payload.invoice_id);
  if (!invoice) {
    throw new AppError(httpStatus.NOT_FOUND, "Original Invoice not found");
  }
  // const warehouse = await WarehouseModel.findById(payload.warehouse_id);
  // if (!warehouse) {
  //   throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found");
  // }
  const result = await InvoiceReturnModel.create(payload);
  return result;
};

const getAllInvoiceReturnDB = async (query: Record<string, unknown>, user_id: string) => {
  // isDeleted/isArchive are NOT hard-coded here: queryBuilder.filter() applies
  // buildSoftDeleteFilter, which defaults to "active only" and honours
  // ?isDeleted=true (Trash tab) and ?isArchive=true (Archive tab). Pinning them
  // here would override those tabs. paginate() counts the fully-filtered query.
  const buildQuery = new queryBuilder(
    InvoiceReturnModel.find({ user_id }).populate("invoice_id").populate("warehouse_id"),
    query
  );

  // Search matches the return's own text AND its source invoice number and
  // warehouse name (both referenced) — mirrors what the list showed, so a
  // `searchTerm` finds returns by invoice number / warehouse, not just reason.
  // Awaited before filter/paginate.
  await buildQuery.searchNested({
    localFields: ["notes", "return_reason"],
    refs: [
      {
        foreignField: "invoice_id",
        model: InvoiceModel as unknown as Model<unknown>,
        fields: ["invoice_number"],
        refFilter: { user_id },
      },
      {
        foreignField: "warehouse_id",
        model: WarehouseModel as unknown as Model<unknown>,
        fields: ["name"],
        refFilter: { user_id },
      },
    ],
  });

  buildQuery.filter().sort().fields();

  const { totalData } = await buildQuery.paginate();

  const allReturns = await buildQuery.modelQuery.exec();
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query.limit) || 10;
  const pagination = buildQuery.calculatePagination({
    totalData,
    currentPage,
    limit,
  });

  return { allReturns, pagination };
};

const getSingleInvoiceReturnDB = async (id: string, user_id: string) => {
  // Not pinned to isDeleted false: the single view must open records from the
  // Trash and Archive tabs too (still scoped to the owner).
  const invoiceReturn = await InvoiceReturnModel.findOne({
    _id: id,
    user_id,
  }).populate("invoice_id").populate("warehouse_id")

  if (!invoiceReturn) {
    throw new AppError(httpStatus.NOT_FOUND, "Invoice Return not found");
  }
  return invoiceReturn;
};

const updateInvoiceReturnDB = async (
  id: string,
  user_id: string,
  payload: Partial<TInvoiceReturn>
) => {
  const invoiceReturn = await InvoiceReturnModel.findOneAndUpdate(
    { _id: id, user_id },
    payload,
    { new: true, runValidators: true }
  );
  if (!invoiceReturn) {
    throw new AppError(httpStatus.NOT_FOUND, "Invoice Return not found");
  }
  return invoiceReturn;
};

const deleteInvoiceReturnDBOne = async (id: string, user_id: string) => {
  const invoiceReturn = await InvoiceReturnModel.findOneAndUpdate(
    { _id: id, user_id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!invoiceReturn) {
    throw new AppError(httpStatus.NOT_FOUND, "Invoice Return not found");
  }
  return invoiceReturn;
};

/** Approve return → draft credit note (Laravel: ApproveSalesReturn → CreateCreditNoteFromReturn). */
const approveInvoiceReturnDB = async (id: string, user_id: string) => {
  const salesReturn = await InvoiceReturnModel.findOne({ _id: id, user_id, isDeleted: false });
  if (!salesReturn) {
    throw new AppError(httpStatus.NOT_FOUND, "Invoice Return not found");
  }
  if (salesReturn.status === "Approved") {
    throw new AppError(httpStatus.BAD_REQUEST, "Sales return is already approved");
  }
  const creditNote = await createCreditNoteFromInvoiceReturn(user_id, salesReturn);
  salesReturn.status = "Approved";
  salesReturn.credit_note_id = creditNote._id;
  await salesReturn.save();
  return { salesReturn, creditNote };
};

const deleteInvoiceReturnDB = withBulkDeleteId(deleteInvoiceReturnDBOne);

// `delete` is a soft delete (isDeleted: true); restore brings a trashed return
// back to the active list. Counterpart of deleteInvoiceReturnDBOne.
const restoreInvoiceReturnDB = async (id: string, user_id: string) => {
  const restored = await InvoiceReturnModel.findOneAndUpdate(
    { _id: id, user_id, isDeleted: true },
    { isDeleted: false },
    { new: true }
  );
  if (!restored) {
    throw new AppError(httpStatus.NOT_FOUND, "Invoice Return not found in Trash");
  }
  return restored;
};

export const invoiceReturnService = {
  createInvoiceReturnDB,
  getAllInvoiceReturnDB,
  getSingleInvoiceReturnDB,
  updateInvoiceReturnDB,
  deleteInvoiceReturnDB,
  approveInvoiceReturnDB,
  restoreInvoiceReturnDB,
};
