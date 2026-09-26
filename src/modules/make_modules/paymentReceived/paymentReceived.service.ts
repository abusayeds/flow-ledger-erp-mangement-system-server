import httpStatus from 'http-status';
import AppError from '../../../errors/AppError';
import { CLIENT_POPULATE_SELECT } from '../../../utils/partyUser';
import { validateDocumentParties } from '../../../utils/documentPartyValidation';
import { TPaymentReceived } from './paymentReceived.interface';
import { ProductModel } from '../product/product.model';
import { ServiceModel } from '../service/service.model';
import { TProduct } from '../product/product.interface';
import { TService } from '../service/service.interface';
import { calculateInvoice } from '../utils/calculateInvoice';
import { validateItemAmount } from '../utils/validateItemAmount';
import { PaymentReceivedModel } from './paymentReceived.model';
import { InvoiceModel } from '../invoice/invoice.model';
import queryBuilder from '../../../builder/queryBuilder';
import { withBulkDeleteId } from '../../../utils/bulkDelete';
import { UserModel } from '../../basic_modules/user/user.model';

const createDB = async (payload: TPaymentReceived) => {
  await validateDocumentParties(payload);
  if (Array.isArray(payload.product)) {
    for (const item of payload.product) {
      const product = (await ProductModel.findById(item.product_id)) as TProduct;
      if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, 'Product not found with id: ' + item.product_id);
      }
      // Submitted rate accepted as-is: the line rate is a historical record and
      // the form lets the user edit it freely (NewPoLineItemRow). Comparing it
      // to the CURRENT catalog price rejected edited rates and discounts.
      validateItemAmount(item, 'product');
    }
  }
  if (Array.isArray(payload.service)) {
    for (const item of payload.service) {
      const service = (await ServiceModel.findById(item.service_id)) as TService;
      if (!service) {
        throw new AppError(httpStatus.NOT_FOUND, 'Service not found with id: ' + item.service_id);
      }
      // Submitted rate accepted as-is — see the product note above.
      validateItemAmount(item, 'service');
    }
  }
  const result = await calculateInvoice(payload);
  const data = { ...payload, ...withSubmittedTotal(payload, result) };
  const createdRecord = await PaymentReceivedModel.create(data);
  // When the payment is applied to an invoice, accumulate it and derive the
  // invoice's status from the running balance: fully covered → Paid, else
  // Partial. This is what auto-marks a paid-off invoice as Paid.
  if (payload.invoice_id) {
    await applyPaymentToInvoice(payload.invoice_id, Number(data.total) || 0);
  }
  return createdRecord;
};

/** Adds [amount] to an invoice's paid total and updates its balance + status. */
const applyPaymentToInvoice = async (invoiceId: unknown, amount: number) => {
  if (!invoiceId || amount <= 0) return;
  const invoice = await InvoiceModel.findById(invoiceId);
  if (!invoice) return;
  const total = Number(invoice.total) || 0;
  const paid = (Number(invoice.paid_amount) || 0) + amount;
  const balance = Math.max(0, total - paid);
  invoice.paid_amount = paid;
  invoice.balance_amount = balance;
  if (total > 0 && balance <= 0) {
    invoice.status = 'Paid';
  } else if (paid > 0) {
    invoice.status = 'Partial';
  }
  await invoice.save();
};

/**
 * A payment received is recorded as a single amount — the app's form has no
 * line items. [calculateInvoice] derives the total from lines, so with none it
 * returns 0 and the amount would be lost. When nothing was itemised, the
 * submitted total/sub_total is kept instead.
 */
const withSubmittedTotal = (
  payload: TPaymentReceived,
  computed: Record<string, unknown>
) => {
  const hasLines =
    (Array.isArray(payload.product) && payload.product.length > 0) ||
    (Array.isArray(payload.service) && payload.service.length > 0);
  if (hasLines) return computed;

  const total = Number(payload.total) || 0;
  return {
    ...computed,
    sub_total: Number(payload.sub_total) || total,
    total,
  };
};

const updateDB = async (
  id: string,
  userId: string,
  payload: TPaymentReceived
) => {
  const existing = await PaymentReceivedModel.findOne({
    _id: id,
    user_id: userId,
    isDeleted: false,
  });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'PaymentReceived not found');
  }

  await validateDocumentParties(payload);
  if (Array.isArray(payload.product)) {
    for (const item of payload.product) {
      if (item.product_id) {
        const product = await ProductModel.findById(item.product_id);
        if (!product) {
          throw new AppError(
            httpStatus.NOT_FOUND,
            'Product not found with id: ' + item.product_id
          );
        }
      }
      validateItemAmount(item, 'product');
    }
  }

  const merged = { ...existing.toObject(), ...payload } as TPaymentReceived;
  const computed = await calculateInvoice(merged);
  const update: Record<string, unknown> = {
    ...payload,
    ...withSubmittedTotal(merged, computed),
  };
  delete update.user_id;
  delete update.isDeleted;

  return await PaymentReceivedModel.findOneAndUpdate(
    { _id: id, user_id: userId },
    update,
    { new: true, runValidators: true }
  );
};

/** Soft delete, so the row leaves the list but can be brought back. */
const deleteDBOne = async (id: string, userId: string) => {
  const deleted = await PaymentReceivedModel.findOneAndUpdate(
    { _id: id, user_id: userId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!deleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'PaymentReceived not found');
  }
  return deleted;
};

const deleteDB = withBulkDeleteId(deleteDBOne);

const restoreDB = async (id: string, userId: string) => {
  const restored = await PaymentReceivedModel.findOneAndUpdate(
    { _id: id, user_id: userId, isDeleted: true },
    { isDeleted: false },
    { new: true }
  );
  if (!restored) {
    throw new AppError(httpStatus.NOT_FOUND, 'PaymentReceived not found in Trash');
  }
  return restored;
};

/** Permanent delete from Trash — removes the row. */
const hardDeleteDBOne = async (id: string, userId: string) => {
  const removed = await PaymentReceivedModel.findOneAndDelete({ _id: id, user_id: userId });
  if (!removed) throw new AppError(httpStatus.NOT_FOUND, 'PaymentReceived not found');
  return removed;
};
const hardDeleteDB = withBulkDeleteId(hardDeleteDBOne);

const getSingleDB = async (id: string, userId: string) => {
  const record = await PaymentReceivedModel.findOne({
    _id: id,
    user_id: userId,
    isArchive: false,
    isDeleted: false,
  });
  if (!record) {
    throw new AppError(httpStatus.NOT_FOUND, 'PaymentReceived not found');
  }
  return record;
};

const getAllDB = async (query: Record<string, unknown>, user_id: string) => {
  // isDeleted/isArchive are NOT hard-coded here: queryBuilder.filter() applies
  // buildSoftDeleteFilter, which defaults to "active only" and honours
  // ?isDeleted=true (Trash tab). Pinning them here would override it.
  //
  // Optional ?invoice_id= scopes the list to ONE invoice's payments — used when
  // the list is opened from a specific invoice. Applied explicitly on the base
  // query (and removed from `query` so queryBuilder.filter() doesn't re-cast it).
  const baseFilter: Record<string, unknown> = { user_id: user_id };
  const invoiceId =
    typeof query.invoice_id === 'string' ? query.invoice_id.trim() : '';
  if (invoiceId) baseFilter.invoice_id = invoiceId;
  delete query.invoice_id;

  const buildQuery = new queryBuilder(
    PaymentReceivedModel.find(baseFilter).populate({
      path: 'customer_id',
      select: CLIENT_POPULATE_SELECT,
    }),
    query
  );

  // Search matches the payment's own text, the free-text customer_name, AND the
  // picked customer (referenced User) — so `searchTerm` finds receipts by
  // customer name/company, not just the invoice number. Awaited before filter.
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
  const { totalData } = await buildQuery.paginate();
  const allRecords = await buildQuery.modelQuery.exec();
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query.limit) || 10;
  const pagination = buildQuery.calculatePagination({ totalData, currentPage, limit });
  return { allRecords, pagination };
};

export const paymentReceivedService = {
  createDB,
  getSingleDB,
  getAllDB,
  updateDB,
  deleteDB,
  restoreDB,
  hardDeleteDB,
};


