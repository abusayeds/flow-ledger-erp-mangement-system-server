import httpStatus from 'http-status';
import AppError from '../../../errors/AppError';
import { CLIENT_POPULATE_SELECT } from '../../../utils/partyUser';
import { validateDocumentParties } from '../../../utils/documentPartyValidation';
import { TDebitNote } from './debitNote.interface';
import { ProductModel } from '../product/product.model';
import { ServiceModel } from '../service/service.model';
import { TProduct } from '../product/product.interface';
import { TService } from '../service/service.interface';
import { calculateInvoice } from '../utils/calculateInvoice';
import { validateItemAmount } from '../utils/validateItemAmount';
import { DebitNoteModel } from './debitNote.model';
import queryBuilder from '../../../builder/queryBuilder';
import { withBulkDeleteId } from "../../../utils/bulkDelete";

const createDB = async (payload: TDebitNote) => {
  await validateDocumentParties(payload);
  const fromReturn = payload.source === "return";
  if (!fromReturn && Array.isArray(payload.product)) {
    for (const item of payload.product) {
      if (item.product_id) {
        const product = (await ProductModel.findById(item.product_id)) as TProduct;
        if (!product) {
          throw new AppError(httpStatus.NOT_FOUND, 'Product not found with id: ' + item.product_id);
        }
        // Submitted rate accepted as-is: the line rate is a historical record and
        // the debit-note form lets the user edit it freely (NewPoLineItemRow).
      } else {
        // Typed free-text name with no suggestion picked: add it to the catalog
        // and use the new id (matches the invoice create path).
        const createdProduct = await ProductModel.create({
          user_id: payload.user_id,
          productName: item.product_name,
          quantity: item.quantity,
          pricing: {
            buyPrice: item.rate,
            buyPriceTax: item.tax,
            sellPrice: item.rate,
            sellPriceTax: item.tax,
            currency: (payload as { currency?: string }).currency ?? 'USD',
          },
          stock: { onHandStock: 0, committedStock: 0, availableForSale: 0, toBeInvoiced: 0, toBeBilled: 0 },
          description: item.description,
        });
        item.product_id = createdProduct._id;
      }
      validateItemAmount(item, 'product');
    }
  }
  if (!fromReturn && Array.isArray(payload.service)) {
    for (const item of payload.service) {
      if (item.service_id) {
        const service = (await ServiceModel.findById(item.service_id)) as TService;
        if (!service) {
          throw new AppError(httpStatus.NOT_FOUND, 'Service not found with id: ' + item.service_id);
        }
        // Submitted rate accepted as-is — see the product note above.
      } else if (!item.service_name) {
        throw new AppError(httpStatus.BAD_REQUEST, 'service_name is required when service_id is not provided.');
      }
      validateItemAmount(item, 'service');
    }
  }
  const result = await calculateInvoice(payload);
  const data = { ...payload, ...result };
  data.source = data.source ?? "manual";
  data.applied_amount = data.applied_amount ?? 0;
  data.balance_amount = data.balance_amount ?? data.total ?? 0;
  const createdRecord = await DebitNoteModel.create(data);
  return createdRecord;
};

const updateDraftDB = async (
  id: string,
  userId: string,
  payload: Partial<TDebitNote>,
) => {
  const record = await DebitNoteModel.findOne({ _id: id, user_id: userId, isDeleted: false });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Debit note not found");
  if (record.status !== "Draft") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only draft debit notes can be edited");
  }

  // Merge the incoming patch over the stored record, then re-run the same
  // validation + totals pipeline as createDB so the note stays consistent.
  const merged = { ...record.toObject(), ...payload, user_id: record.user_id, status: "Draft" } as TDebitNote;
  await validateDocumentParties(merged);
  const fromReturn = merged.source === "return";
  if (!fromReturn && Array.isArray(merged.product)) {
    for (const item of merged.product) {
      if (item.product_id) {
        const product = (await ProductModel.findById(item.product_id)) as TProduct;
        if (!product) {
          throw new AppError(httpStatus.NOT_FOUND, 'Product not found with id: ' + item.product_id);
        }
      } else {
        const createdProduct = await ProductModel.create({
          user_id: merged.user_id,
          productName: item.product_name,
          quantity: item.quantity,
          pricing: {
            buyPrice: item.rate,
            buyPriceTax: item.tax,
            sellPrice: item.rate,
            sellPriceTax: item.tax,
            currency: (merged as { currency?: string }).currency ?? 'USD',
          },
          stock: { onHandStock: 0, committedStock: 0, availableForSale: 0, toBeInvoiced: 0, toBeBilled: 0 },
          description: item.description,
        });
        item.product_id = createdProduct._id;
      }
      validateItemAmount(item, 'product');
    }
  }
  if (!fromReturn && Array.isArray(merged.service)) {
    for (const item of merged.service) {
      if (item.service_id) {
        const service = (await ServiceModel.findById(item.service_id)) as TService;
        if (!service) {
          throw new AppError(httpStatus.NOT_FOUND, 'Service not found with id: ' + item.service_id);
        }
      } else if (!item.service_name) {
        throw new AppError(httpStatus.BAD_REQUEST, 'service_name is required when service_id is not provided.');
      }
      validateItemAmount(item, 'service');
    }
  }
  const result = await calculateInvoice(merged);
  Object.assign(record, merged, result);
  record.balance_amount = (record.total ?? 0) - (record.applied_amount ?? 0);
  await record.save();
  return record;
};

const approveDB = async (id: string, userId: string) => {
  const record = await DebitNoteModel.findOne({
    _id: id,
    user_id: userId,
    isDeleted: false,
  });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Debit note not found");
  if (record.status !== "Draft") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only draft debit notes can be approved");
  }
  record.status = "Approved";
  const total = record.total ?? 0;
  if (record.balance_amount === undefined || record.balance_amount === null) {
    record.balance_amount = total - (record.applied_amount ?? 0);
  }
  await record.save();
  return record;
};

const updateSignatureDB = async (
  id: string,
  userId: string,
  signature: string,
) => {
  if (!signature || typeof signature !== 'string') {
    throw new AppError(httpStatus.BAD_REQUEST, 'signature (file path) is required');
  }
  const record = await DebitNoteModel.findOne({
    _id: id,
    user_id: userId,
    isDeleted: false,
  });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, 'Debit note not found');
  record.signature = signature;
  await record.save();
  return record;
};

const deleteDraftDBOne = async (id: string, userId: string) => {
  // Soft-trash any status (list Trash tab); permanent delete is a separate hard-delete path if added later.
  const trashed = await DebitNoteModel.findOneAndUpdate(
    { _id: id, user_id: userId, isDeleted: false },
    { isDeleted: true },
    { new: true },
  );
  if (!trashed) throw new AppError(httpStatus.NOT_FOUND, "Debit note not found");
  return trashed;
};

const getSingleDB = async (id: string, userId: string) => {
  // Not pinned to isDeleted/isArchive false: single view must open Trash/Archive rows too.
  const record = await DebitNoteModel.findOne({
    _id: id,
    user_id: userId,
  }).populate({
    path: 'vendor_id',
    select: CLIENT_POPULATE_SELECT,
  });
  if (!record) {
    throw new AppError(httpStatus.NOT_FOUND, 'DebitNote not found');
  }
  return record;
};

const getAllDB = async (query: Record<string, unknown>, user_id: string) => {
  // Tabs (Active / Applied / Trash) via the soft-delete engine: ?isDeleted=true
  // returns the trashed set; .filter() applies ?status=. Base find no longer
  // hard-codes isDeleted:false so Trash can return deleted rows.
  const buildQuery = new queryBuilder(
    DebitNoteModel.find({
      user_id: user_id,
    }).populate({
      path: 'vendor_id',
      select: CLIENT_POPULATE_SELECT,
    }),
    query
  )
    .search(['internal_notes', 'notes', 'terms_and_conditions', 'invoice_number', 'sub_title'])
    .filter()
    .sort()
    .fields();
  const { totalData } = await buildQuery.paginate();
  const allRecords = await buildQuery.modelQuery.exec();
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query.limit) || 10;
  const pagination = buildQuery.calculatePagination({ totalData, currentPage, limit });
  return { allRecords, pagination };
};

const deleteDraftDB = withBulkDeleteId(deleteDraftDBOne);

export const debitNoteService = { createDB, updateDraftDB, getSingleDB, getAllDB, approveDB, deleteDraftDB, updateSignatureDB };


