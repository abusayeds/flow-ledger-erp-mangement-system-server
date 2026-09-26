import httpStatus from 'http-status';
import AppError from '../../../errors/AppError';
import { CLIENT_POPULATE_SELECT } from '../../../utils/partyUser';
import { validateDocumentParties } from '../../../utils/documentPartyValidation';
import { TBill } from './bill.interface';
import { ProductModel } from '../product/product.model';
import { ServiceModel } from '../service/service.model';
import { TProduct } from '../product/product.interface';
import { TService } from '../service/service.interface';
import { calculateInvoice } from '../utils/calculateInvoice';
import { validateItemAmount } from '../utils/validateItemAmount';
import { BillModel } from './bill.model';
import queryBuilder from '../../../builder/queryBuilder';
import { withBulkDeleteId } from '../../../utils/bulkDelete';
import { UserModel } from '../../basic_modules/user/user.model';

const createDB = async (payload: TBill) => {
  await validateDocumentParties(payload);
  if (Array.isArray(payload.product)) {
    for (const item of payload.product) {
      if (item.product_id) {
        const product = (await ProductModel.findById(item.product_id)) as TProduct;
        if (!product) {
          throw new AppError(httpStatus.NOT_FOUND, 'Product not found with id: ' + item.product_id);
        }
        // Submitted rate accepted as-is: the line rate is a historical record and
        // the bill form lets the user edit it freely (NewPoLineItemRow).
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
  data.paid_amount = data.paid_amount ?? 0;
  data.balance_amount = data.balance_amount ?? data.total ?? 0;
  const createdRecord = await BillModel.create(data);
  return createdRecord;
};

const getSingleDB = async (id: string, userId: string) => {
  // Not pinned to isDeleted/isArchive false: the single view must open records
  // from the Trash and Archive tabs too (still scoped to the owner).
  const record = await BillModel.findOne({
    _id: id,
    user_id: userId,
  }).populate({
    path: 'vendor_id',
    select: CLIENT_POPULATE_SELECT,
  });
  if (!record) {
    throw new AppError(httpStatus.NOT_FOUND, 'Bill not found');
  }
  return record;
};

const getAllDB = async (query: Record<string, unknown>, user_id: string) => {
  // isDeleted/isArchive are NOT hard-coded here: queryBuilder.filter() applies
  // buildSoftDeleteFilter, which defaults to "active only" and honours
  // ?isDeleted=true (Trash tab) and ?isArchive=true (Archive tab). Pinning them
  // here would override those tabs. paginate() counts the fully-filtered query.
  const buildQuery = new queryBuilder(
    BillModel.find({ user_id: user_id })
      .populate({
        path: 'vendor_id',
        select: CLIENT_POPULATE_SELECT,
      })
      .populate({
        path: 'product.product_id',
        select: 'productName description',
      }),
    query
  );

  // Search matches the bill's own text, the free-text vendor_name, AND the
  // picked vendor (referenced User) — so `searchTerm` finds bills by vendor
  // name/company, not just the invoice number. Awaited before filter/paginate.
  await buildQuery.searchNested({
    localFields: [
      'internal_notes',
      'notes',
      'terms_and_conditions',
      'invoice_number',
      'sub_title',
      'vendor_name',
    ],
    refs: [
      {
        foreignField: 'vendor_id',
        model: UserModel,
        fields: ['name', 'email', 'phone'],
        dotFields: ['businessProfile.companyName'],
        refFilter: { companyId: user_id },
      },
    ],
  });

  buildQuery.filter().sort().fields();
  const { totalData } = await buildQuery.paginate();
  const allRecords = await buildQuery.modelQuery.exec();
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query.limit) || 10;
  const pagination = buildQuery.calculatePagination({ totalData, currentPage, limit });
  return { allRecords, pagination };
};

const updateDB = async (id: string, userId: string, payload: TBill) => {
  const existing = await BillModel.findOne({ _id: id, user_id: userId });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Bill not found');
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
        // the bill form lets the user edit it freely (NewPoLineItemRow).
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

  // Only recompute money fields when the line items change. A partial update
  // (e.g. just flipping status) must NOT wipe sub_total/total/balance.
  const recalcTotals = payload.product !== undefined || payload.service !== undefined;

  let data: Record<string, unknown> = { ...payload };
  if (recalcTotals) {
    const result = await calculateInvoice({ ...existing.toObject(), ...payload });
    const paid = payload.paid_amount ?? existing.paid_amount ?? 0;
    data = {
      ...payload,
      ...result,
      paid_amount: paid,
      balance_amount: Math.max(0, (result.total ?? 0) - paid),
    };
  }

  const updatedRecord = await BillModel.findOneAndUpdate(
    { _id: id, user_id: userId },
    data,
    { new: true, runValidators: true }
  );
  return updatedRecord;
};

const deleteDBOne = async (id: string, userId: string) => {
  const deletedRecord = await BillModel.findOneAndUpdate(
    { _id: id, user_id: userId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!deletedRecord) {
    throw new AppError(httpStatus.NOT_FOUND, 'Bill not found');
  }
  return deletedRecord;
};

const deleteDB = withBulkDeleteId(deleteDBOne);

// `delete` is a soft delete (isDeleted: true); restore brings a trashed bill
// back to the active list. Counterpart of deleteDBOne.
const restoreDB = async (id: string, userId: string) => {
  const restored = await BillModel.findOneAndUpdate(
    { _id: id, user_id: userId, isDeleted: true },
    { isDeleted: false },
    { new: true }
  );
  if (!restored) {
    throw new AppError(httpStatus.NOT_FOUND, 'Bill not found in Trash');
  }
  return restored;
};

export const billService = { createDB, getSingleDB, getAllDB, updateDB, deleteDB, restoreDB };


