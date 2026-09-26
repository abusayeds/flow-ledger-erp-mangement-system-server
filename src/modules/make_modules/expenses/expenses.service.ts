import httpStatus from 'http-status';
import AppError from '../../../errors/AppError';
import { CLIENT_POPULATE_SELECT } from '../../../utils/partyUser';
import { validateDocumentParties } from '../../../utils/documentPartyValidation';
import { TExpenses } from './expenses.interface';
import { ProductModel } from '../product/product.model';
import { ServiceModel } from '../service/service.model';
import { TProduct } from '../product/product.interface';
import { TService } from '../service/service.interface';
import { calculateInvoice } from '../utils/calculateInvoice';
import { validateItemAmount } from '../utils/validateItemAmount';
import { ExpensesModel } from './expenses.model';
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
    vendor_name: row.vendor_name ?? null,
    category: row.category ?? null,
    date: row.date ?? null,
    terms_and_conditions: row.terms_and_conditions ?? null,
    notes: row.notes ?? null,
    total: row.total ?? 0,
    status: row.status ?? null,
    createdAt: row.createdAt ?? null,
  };
};

const createDB = async (payload: TExpenses) => {
  await validateDocumentParties(payload);
  if (Array.isArray(payload.product)) {
    for (const item of payload.product) {
      if (item.product_id) {
        const product = (await ProductModel.findById(item.product_id)) as TProduct;
        if (!product) {
          throw new AppError(httpStatus.NOT_FOUND, 'Product not found with id: ' + item.product_id);
        }
        // Submitted rate accepted as-is: the line rate is a historical record.
      } else {
        // Typed free-text name: add it to the catalog and use the new id.
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
  // Expenses can be a flat amount with no line items — honour the payload's
  // total/sub_total in that case (calculateInvoice would otherwise zero them).
  const hasItems =
    (Array.isArray(payload.product) && payload.product.length > 0) ||
    (Array.isArray(payload.service) && payload.service.length > 0);
  if (!hasItems) {
    const flat = Number(payload.total ?? payload.sub_total ?? 0);
    data.sub_total = flat;
    data.total = flat;
  }
  const createdRecord = await ExpensesModel.create(data);
  return createdRecord;
};

const getSingleDB = async (id: string, userId: string) => {
  const record = await ExpensesModel.findOne({
    _id: id,
    user_id: userId,
    isArchive: false,
    isDeleted: false,
  });
  if (!record) {
    throw new AppError(httpStatus.NOT_FOUND, 'Expenses not found');
  }
  return record;
};

const getAllDB = async (query: Record<string, unknown>, user_id: string) => {
  // Active / Invoiced / Recurring / Trash tabs are driven by the query: the
  // soft-delete engine reads ?isDeleted / ?isArchive (Trash = ?isDeleted=true),
  // and .filter() applies ?status=invoiced|recurring. Base find no longer
  // hard-codes isDeleted:false so the Trash tab can return deleted rows.
  const buildQuery = new queryBuilder(
    ExpensesModel.find({
      user_id: user_id,
    })
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

const updateDB = async (id: string, userId: string, payload: TExpenses) => {
  const existing = await ExpensesModel.findOne({
    _id: id,
    user_id: userId
  });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Expenses not found');
  }

  await validateDocumentParties(payload);
  if (Array.isArray(payload.product)) {
    for (const item of payload.product) {
      if (item.product_id) {
        const product = (await ProductModel.findById(item.product_id)) as TProduct;
        if (!product) {
          throw new AppError(httpStatus.NOT_FOUND, 'Product not found with id: ' + item.product_id);
        }
        // Submitted rate accepted as-is: the line rate is a historical record.
      } else {
        // Typed free-text name: add it to the catalog and use the new id.
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
    const merged = { ...existing.toObject(), ...payload };
    const result = await calculateInvoice(merged);
    data = { ...payload, ...result };
    const hasItems =
      (Array.isArray(merged.product) && merged.product.length > 0) ||
      (Array.isArray(merged.service) && merged.service.length > 0);
    if (!hasItems) {
      const flat = Number(payload.total ?? payload.sub_total ?? existing.total ?? 0);
      data.sub_total = flat;
      data.total = flat;
    }
  } else if (payload.total !== undefined || payload.sub_total !== undefined) {
    // Flat-amount edit (no items touched) — accept the new total directly.
    const flat = Number(payload.total ?? payload.sub_total ?? 0);
    data.sub_total = flat;
    data.total = flat;
  }

  const updatedRecord = await ExpensesModel.findOneAndUpdate(
    { _id: id, user_id: userId },
    data,
    { new: true, runValidators: true }
  );
  return updatedRecord;
};

const deleteDBOne = async (id: string, userId: string) => {
  const deletedRecord = await ExpensesModel.findOneAndUpdate(
    { _id: id, user_id: userId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!deletedRecord) {
    throw new AppError(httpStatus.NOT_FOUND, 'Expenses not found');
  }
  return deletedRecord;
};

const deleteDB = withBulkDeleteId(deleteDBOne);

export const expensesService = { createDB, getSingleDB, getAllDB, updateDB, deleteDB };


