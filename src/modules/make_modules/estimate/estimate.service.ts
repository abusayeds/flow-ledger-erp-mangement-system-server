import httpStatus from 'http-status';
import AppError from '../../../errors/AppError';
import { CLIENT_POPULATE_SELECT } from '../../../utils/partyUser';
import { validateDocumentParties } from '../../../utils/documentPartyValidation';
import { TEstimate } from './estimate.interface';
import { ProductModel } from '../product/product.model';
import { ServiceModel } from '../service/service.model';
import { TProduct } from '../product/product.interface';
import { TService } from '../service/service.interface';
import { calculateInvoice } from '../utils/calculateInvoice';
import { validateItemAmount } from '../utils/validateItemAmount';
import { EstimateModel } from './estimate.model';
import queryBuilder from '../../../builder/queryBuilder';
import { withBulkDeleteId } from "../../../utils/bulkDelete";

const formatParty = (party: unknown) => {
  if (party && typeof party === 'object' && party !== null && '_id' in party) {
    return {
      _id: (party as { _id: unknown })._id,
      name: (party as { name?: string }).name ?? null,
    };
  }
  return party ?? null;
};

const formatListItem = (doc: unknown) => {
  const row =
    doc && typeof doc === 'object' && 'toObject' in doc && typeof (doc as { toObject: () => unknown }).toObject === 'function'
      ? (doc as { toObject: () => Record<string, unknown> }).toObject()
      : (doc as Record<string, unknown>);

  return {
    _id: row._id,
    invoice_number: row.invoice_number ?? null,
    customer_id: formatParty(row.customer_id),
    customer_name: row.customer_name ?? null,
    vendor_id: formatParty(row.vendor_id),
    terms_and_conditions: row.terms_and_conditions ?? null,
    notes: row.notes ?? null,
    total: row.total ?? 0,
    status: row.status ?? null,
    createdAt: row.createdAt ?? null,
  };
};

const createDB = async (payload: TEstimate) => {
  await validateDocumentParties(payload);
  if (Array.isArray(payload.product)) {
    for (const item of payload.product) {
      if (item.product_id) {
        const product = (await ProductModel.findById(item.product_id)) as TProduct;
        if (!product) {
          throw new AppError(httpStatus.NOT_FOUND, 'Product not found with id: ' + item.product_id);
        }
        // Submitted rate accepted as-is: the line rate is a historical record and
        // the form lets the user edit it freely (NewPoLineItemRow).
      } else {
        // Typed free-text name with no suggestion picked: add it to the catalog
        // and use the new id (matches the invoice create path).
        const createdProduct = await ProductModel.create({
          user_id: payload.user_id,
          productName: item.product_name,
          quantity: item.quantity,
          pricing: {
            buyPrice: 0,
            buyPriceTax: 0,
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
  if (Array.isArray(payload.service)) {
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
  const createdRecord = await EstimateModel.create(data);
  return createdRecord;
};

const getSingleDB = async (id: string, userId: string) => {
  // Not pinned to isDeleted/isArchive false: Trash/Archive detail must still open.
  const record = await EstimateModel.findOne({
    _id: id,
    user_id: userId,
    // Populate the customer so the single response carries the customer NAME
    // (read by "Duplicate as …").
  }).populate({ path: 'customer_id', select: CLIENT_POPULATE_SELECT });
  if (!record) {
    throw new AppError(httpStatus.NOT_FOUND, 'Estimate not found');
  }
  return record;
};

const getAllDB = async (query: Record<string, unknown>, user_id: string) => {
  // isDeleted/isArchive are NOT hard-coded here: queryBuilder.filter() applies
  // buildSoftDeleteFilter, which defaults to "active only" and honours
  // ?isDeleted=true (Trash tab). Pinning them here would override that tab.
  const buildQuery = new queryBuilder(
    EstimateModel.find({ user_id: user_id })
      .populate({ path: 'customer_id', select: CLIENT_POPULATE_SELECT })
      .populate({ path: 'vendor_id', select: CLIENT_POPULATE_SELECT }),
    query
  )
    .search(['internal_notes', 'notes', 'terms_and_conditions', 'invoice_number', 'sub_title'])
    .filter()
    .sort()
    .fields();
  const { totalData } = await buildQuery.paginate();
  const allRecords = (await buildQuery.modelQuery.exec()).map(formatListItem);
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query.limit) || 10;
  const pagination = buildQuery.calculatePagination({ totalData, currentPage, limit });
  return { allRecords, pagination };
};

const updateDB = async (id: string, userId: string, payload: TEstimate) => {
  const existing = await EstimateModel.findOne({
    _id: id,
    user_id: userId
  });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Estimate not found');
  }

  await validateDocumentParties(payload);
  if (Array.isArray(payload.product)) {
    for (const item of payload.product) {
      if (item.product_id) {
        const product = (await ProductModel.findById(item.product_id)) as TProduct;
        if (!product) {
          throw new AppError(httpStatus.NOT_FOUND, 'Product not found with id: ' + item.product_id);
        }
        // Submitted rate accepted as-is: the line rate is a historical record and
        // the form lets the user edit it freely (NewPoLineItemRow).
      } else {
        // Typed free-text name with no suggestion picked: add it to the catalog
        // and use the new id (matches the invoice create path).
        const createdProduct = await ProductModel.create({
          user_id: payload.user_id,
          productName: item.product_name,
          quantity: item.quantity,
          pricing: {
            buyPrice: 0,
            buyPriceTax: 0,
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
  if (Array.isArray(payload.service)) {
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

  const recalcTotals = payload.product !== undefined || payload.service !== undefined;
  let data: Record<string, unknown> = { ...payload };
  if (recalcTotals) {
    const result = await calculateInvoice({ ...existing.toObject(), ...payload });
    data = { ...payload, ...result };
  }

  const updatedRecord = await EstimateModel.findOneAndUpdate(
    { _id: id, user_id: userId },
    data,
    { new: true, runValidators: true }
  );
  return updatedRecord;
};

const deleteDBOne = async (id: string, userId: string) => {
  const deletedRecord = await EstimateModel.findOneAndUpdate(
    { _id: id, user_id: userId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!deletedRecord) {
    throw new AppError(httpStatus.NOT_FOUND, 'Estimate not found');
  }
  return deletedRecord;
};

const deleteDB = withBulkDeleteId(deleteDBOne);

// Permanent delete from the Trash tab — actually removes the (already
// soft-deleted) row, so it doesn't 404 like the soft delete above.
const hardDeleteDBOne = async (id: string, userId: string) => {
  const removed = await EstimateModel.findOneAndDelete({ _id: id, user_id: userId });
  if (!removed) throw new AppError(httpStatus.NOT_FOUND, 'Estimate not found');
  return removed;
};
const hardDeleteDB = withBulkDeleteId(hardDeleteDBOne);

/** Restores a soft-deleted estimate — counterpart of deleteDBOne. */
const restoreDB = async (id: string, userId: string) => {
  const restored = await EstimateModel.findOneAndUpdate(
    { _id: id, user_id: userId, isDeleted: true },
    { isDeleted: false },
    { new: true }
  );
  if (!restored) {
    throw new AppError(httpStatus.NOT_FOUND, 'Estimate not found in Trash');
  }
  return restored;
};

export const estimateService = { createDB, getSingleDB, getAllDB, updateDB, deleteDB, hardDeleteDB, restoreDB };


