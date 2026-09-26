import httpStatus from 'http-status';
import AppError from '../../../errors/AppError';
import { CLIENT_POPULATE_SELECT } from '../../../utils/partyUser';
import { validateDocumentParties } from '../../../utils/documentPartyValidation';
import { TSalesReceipt } from './salesReceipt.interface';
import { ProductModel } from '../product/product.model';
import { ServiceModel } from '../service/service.model';
import { TProduct } from '../product/product.interface';
import { TService } from '../service/service.interface';
import { calculateInvoice } from '../utils/calculateInvoice';
import { validateItemAmount } from '../utils/validateItemAmount';
import { SalesReceiptModel } from './salesReceipt.model';
import queryBuilder, { buildSoftDeleteFilter } from '../../../builder/queryBuilder';
import { withBulkDeleteId } from "../../../utils/bulkDelete";
import { UserModel } from '../../basic_modules/user/user.model';
import { generateInvoiceNumber } from '../../../utils/generateInvoiceNumber';

const formatListItem = (doc: unknown) => {
  const row =
    doc && typeof doc === 'object' && 'toObject' in doc && typeof (doc as { toObject: () => unknown }).toObject === 'function'
      ? (doc as { toObject: () => Record<string, unknown> }).toObject()
      : (doc as Record<string, unknown>);

  const customerId =
    row.customer_id && typeof row.customer_id === 'object' && row.customer_id !== null && '_id' in row.customer_id
      ? {
        _id: (row.customer_id as { _id: unknown })._id,
        name: (row.customer_id as { name?: string }).name ?? null,
      }
      : (row.customer_id ?? null);

  return {
    _id: row._id,
    customer_id: customerId,
    customer_name: row.customer_name ?? null,
    invoice_number: row.invoice_number ?? null,
    currency: row.currency ?? null,
    payment_method: row.payment_method ?? null,
    terms_and_conditions: row.terms_and_conditions ?? null,
    notes: row.notes ?? null,
    total: row.total ?? 0,
    status: row.status ?? null,
    createdAt: row.createdAt ?? null,
  };
};

const createDB = async (payload: TSalesReceipt) => {

  // await validateDocumentParties(payload);
  // if (Array.isArray(payload.product)) {
  //   for (const item of payload.product) {
  //     const product = (await ProductModel.findById(item.product_id)) as TProduct;
  //     if (!product) {
  //       throw new AppError(httpStatus.NOT_FOUND, 'Product not found with id: ' + item.product_id);
  //     }
  //     if (product.pricing.sellPrice !== item.rate) {
  //       throw new AppError(httpStatus.BAD_REQUEST, 'Product rate mismatch ' + item.product_id + ': ' + product.pricing.sellPrice + ' vs ' + item.rate);
  //     }
  //     validateItemAmount(item, 'product');
  //   }
  // }
  // if (Array.isArray(payload.service)) {
  //   for (const item of payload.service) {
  //     const service = (await ServiceModel.findById(item.service_id)) as TService;
  //     if (!service) {
  //       throw new AppError(httpStatus.NOT_FOUND, 'Service not found with id: ' + item.service_id);
  //     }
  //     if (service.rate !== item.rate) {
  //       throw new AppError(httpStatus.BAD_REQUEST, 'Service rate mismatch ' + item.service_id + ': ' + service.rate + ' vs ' + item.rate);
  //     }
  //     validateItemAmount(item, 'service');
  //   }
  // }


  // Customer validation
  if (payload.customer_id) {
    await validateDocumentParties({
      customer_id: payload.customer_id,
    });
  } else {
    if (!payload.customer_name?.trim()) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Either customer_id or customer_name is required."
      );
    }
  }

  // Product validation
  if (Array.isArray(payload.product)) {
    for (const item of payload.product) {
      if (item.product_id) {
        const product = await ProductModel.findById(item.product_id);

        if (!product) {
          throw new AppError(
            httpStatus.NOT_FOUND,
            `Product not found with id: ${item.product_id}`
          );
        }

        // Submitted rate accepted as-is: the line rate is a historical record
        // and the form lets the user type any rate or pick a suggestion
        // (NewPoLineItemRow). Comparing to the CURRENT catalog price rejected
        // edited rates, discounts and duplicates of older documents.
      } else {
        if (!item.product_name?.trim()) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            "product_name is required when product_id is not provided."
          );
        }
      }

      validateItemAmount(item, "product");
    }
  }

  // Service validation
  if (Array.isArray(payload.service)) {
    for (const item of payload.service) {
      if (item.service_id) {
        const service = await ServiceModel.findById(item.service_id);

        if (!service) {
          throw new AppError(
            httpStatus.NOT_FOUND,
            `Service not found with id: ${item.service_id}`
          );
        }

        // Submitted rate accepted as-is — see the product note above.
      } else {
        if (!item.service_name?.trim()) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            "service_name is required when service_id is not provided."
          );
        }
      }

      validateItemAmount(item, "service");
    }
  }

  const result = await calculateInvoice(payload);

  const data = {
    ...payload, ...result, invoice_number:
      payload.invoice_number ||
      (await generateInvoiceNumber("SR", "sales")),
  };
  // Persist. This was previously commented out, so the endpoint returned a
  // fully-formed receipt with success:true while saving nothing — creation
  // silently no-opped for every caller (the create form and duplicate alike).
  const createdRecord = await SalesReceiptModel.create(data);
  return createdRecord;
};

const getSingleDB = async (id: string, userId: string) => {
  // Not pinned to isDeleted/isArchive false: the single view must open records
  // from the Trash and Archive tabs too (still scoped to the owner).
  const record = await SalesReceiptModel.findOne({
    _id: id,
    user_id: userId,
    // Populate the customer so the single response carries the customer NAME
    // (read by "Duplicate as …").
  }).populate({ path: 'customer_id', select: CLIENT_POPULATE_SELECT });
  if (!record) {
    throw new AppError(httpStatus.NOT_FOUND, 'SalesReceipt not found');
  }
  return record;
};

const getAllDB = async (query: Record<string, unknown>, user_id: string) => {
  // `delete` on this module is a SOFT delete, so trashed receipts still exist.
  // isDeleted/isArchive are NOT hard-coded here: queryBuilder.filter() applies
  // buildSoftDeleteFilter, which defaults to "active only" and honours
  // ?isDeleted=true for the Trash tab. Pinning them here would override it.
  const baseFilter = { user_id: user_id };

  const buildQuery = new queryBuilder(
    SalesReceiptModel.find(baseFilter).populate({
      path: 'customer_id',
      select: CLIENT_POPULATE_SELECT,
    }),
    query
  );

  // Search matches the document's own text, the free-text customer_name, AND
  // the picked customer (referenced User) — so `searchTerm` finds receipts by
  // customer name/company. Awaited before filter/paginate.
  await buildQuery.searchNested({
    localFields: [
      'internal_notes',
      'notes',
      'terms_and_conditions',
      'invoice_number',
      'sub_title',
      'customer_name',
    ],
    refs: [
      {
        foreignField: 'customer_id',
        model: UserModel,
        fields: ['name', 'email', 'phone'],
        dotFields: ['businessProfile.companyName'],
        refFilter: { companyId: user_id },
      },
    ],
  });

  buildQuery.filter().sort().fields();
  // The count must use the same soft-delete rules as the list, or the Trash tab
  // paginates against the active total.
  const { totalData } = await buildQuery.paginate(
    SalesReceiptModel.find({ ...baseFilter, ...buildSoftDeleteFilter(query) })
  );
  const allRecords = (await buildQuery.modelQuery.exec()).map(formatListItem);
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query.limit) || 10;
  const pagination = buildQuery.calculatePagination({ totalData, currentPage, limit });
  return { allRecords, pagination };
};

const updateDB = async (id: string, userId: string, payload: TSalesReceipt) => {
  const existing = await SalesReceiptModel.findOne({
    _id: id,
    user_id: userId
  });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'SalesReceipt not found');
  }

  await validateDocumentParties(payload);
  if (Array.isArray(payload.product)) {
    for (const item of payload.product) {
      // A line may be free-text (product_name, no id) — mirrors the create path.
      if (item.product_id) {
        const product = (await ProductModel.findById(item.product_id)) as TProduct;
        if (!product) {
          throw new AppError(httpStatus.NOT_FOUND, 'Product not found with id: ' + item.product_id);
        }
        // Submitted rate accepted as-is — see the create path note.
      } else if (!item.product_name?.trim()) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'product_name is required when product_id is not provided.'
        );
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
      } else if (!item.service_name?.trim()) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'service_name is required when service_id is not provided.'
        );
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

  const updatedRecord = await SalesReceiptModel.findOneAndUpdate(
    { _id: id, user_id: userId },
    data,
    { new: true, runValidators: true }
  );
  return updatedRecord;
};

const deleteDBOne = async (id: string, userId: string) => {
  const deletedRecord = await SalesReceiptModel.findOneAndUpdate(
    { _id: id, user_id: userId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!deletedRecord) {
    throw new AppError(httpStatus.NOT_FOUND, 'SalesReceipt not found');
  }
  return deletedRecord;
};

const deleteDB = withBulkDeleteId(deleteDBOne);

/**
 * Permanent delete from the Trash tab — actually removes the (already
 * soft-deleted) row. Unlike [deleteDBOne] it matches regardless of isDeleted,
 * so deleting a trashed receipt works instead of 404-ing.
 */
const hardDeleteDBOne = async (id: string, userId: string) => {
  const removed = await SalesReceiptModel.findOneAndDelete({
    _id: id,
    user_id: userId,
  });
  if (!removed) {
    throw new AppError(httpStatus.NOT_FOUND, 'SalesReceipt not found');
  }
  return removed;
};

const hardDeleteDB = withBulkDeleteId(hardDeleteDBOne);

/**
 * Restores a soft-deleted receipt back into the active list — the counterpart
 * of `delete`, which sets isDeleted: true rather than removing the row.
 */
const restoreDB = async (id: string, userId: string) => {
  const restored = await SalesReceiptModel.findOneAndUpdate(
    { _id: id, user_id: userId, isDeleted: true },
    { isDeleted: false },
    { new: true }
  );
  if (!restored) {
    throw new AppError(httpStatus.NOT_FOUND, 'SalesReceipt not found in Trash');
  }
  return restored;
};

export const salesReceiptService = {
  createDB,
  getSingleDB,
  getAllDB,
  updateDB,
  deleteDB,
  hardDeleteDB,
  restoreDB,
};


