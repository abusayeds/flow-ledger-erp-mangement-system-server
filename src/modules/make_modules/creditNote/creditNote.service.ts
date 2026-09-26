import httpStatus from 'http-status';
import AppError from '../../../errors/AppError';
import { CLIENT_POPULATE_SELECT } from '../../../utils/partyUser';
import { validateDocumentParties } from '../../../utils/documentPartyValidation';
import { TCreditNote } from './creditNote.interface';
import { ProductModel } from '../product/product.model';
import { ServiceModel } from '../service/service.model';
import { TProduct } from '../product/product.interface';
import { TService } from '../service/service.interface';
import { calculateInvoice } from '../utils/calculateInvoice';
import { validateItemAmount } from '../utils/validateItemAmount';
import { CreditNoteModel } from './creditNote.model';
import queryBuilder from '../../../builder/queryBuilder';
import { withBulkDeleteId } from "../../../utils/bulkDelete";
import { UserModel } from '../../basic_modules/user/user.model';

const createDB = async (payload: TCreditNote) => {
  await validateDocumentParties(payload);
  const fromReturn = payload.source === "return";
  if (!fromReturn && Array.isArray(payload.product)) {
    for (const item of payload.product) {
      if (item.product_id) {
        const product = (await ProductModel.findById(item.product_id)) as TProduct;
        if (!product) {
          throw new AppError(httpStatus.NOT_FOUND, 'Product not found with id: ' + item.product_id);
        }
      } else if (!item.product_name?.trim()) {
        // The form lets the user type a product name instead of picking one.
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'product_name is required when product_id is not provided.'
        );
      }
      // Submitted rate accepted as-is: the line rate is a historical record and
      // the form lets the user edit it freely (NewPoLineItemRow). Comparing it
      // to the CURRENT catalog price rejected edited rates and discounts.
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
      } else if (!item.service_name?.trim()) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'service_name is required when service_id is not provided.'
        );
      }
      // Submitted rate accepted as-is — see the product note above.
      validateItemAmount(item, 'service');
    }
  }
  const result = await calculateInvoice(payload);
  const data = { ...payload, ...result };
  data.source = data.source ?? "manual";
  data.applied_amount = data.applied_amount ?? 0;
  data.balance_amount = data.balance_amount ?? data.total ?? 0;
  const createdRecord = await CreditNoteModel.create(data);
  return createdRecord;
};

const approveDB = async (id: string, userId: string) => {
  const record = await CreditNoteModel.findOne({
    _id: id,
    user_id: userId,
    isDeleted: false,
  });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Credit note not found");
  if (record.status !== "Draft") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only draft credit notes can be approved");
  }
  record.status = "Approved";
  const total = record.total ?? 0;
  if (record.balance_amount === undefined || record.balance_amount === null) {
    record.balance_amount = total - (record.applied_amount ?? 0);
  }
  await record.save();
  return record;
};

/**
 * Trashes a credit note whatever its status.
 *
 * [deleteDraftDBOne] refuses anything past Draft, but the app's list offers
 * Trash on every row and keeps a Trash tab to restore from, so a soft delete
 * has to be allowed for applied and partial notes too. It stays a soft delete —
 * [restoreDB] is the counterpart.
 */
const trashDBOne = async (id: string, userId: string) => {
  const trashed = await CreditNoteModel.findOneAndUpdate(
    { _id: id, user_id: userId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!trashed) throw new AppError(httpStatus.NOT_FOUND, 'Credit note not found');
  return trashed;
};

const trashDB = withBulkDeleteId(trashDBOne);

// Permanent delete from the Trash tab — actually removes the (already
// soft-deleted) row, so it doesn't 404 like the soft trash above.
const hardDeleteDBOne = async (id: string, userId: string) => {
  const removed = await CreditNoteModel.findOneAndDelete({ _id: id, user_id: userId });
  if (!removed) throw new AppError(httpStatus.NOT_FOUND, 'Credit note not found');
  return removed;
};
const hardDeleteDB = withBulkDeleteId(hardDeleteDBOne);

/** Brings a trashed credit note back into the active list. */
const restoreDB = async (id: string, userId: string) => {
  const restored = await CreditNoteModel.findOneAndUpdate(
    { _id: id, user_id: userId, isDeleted: true },
    { isDeleted: false },
    { new: true }
  );
  if (!restored) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credit note not found in Trash');
  }
  return restored;
};

/**
 * Edits an existing credit note. The app's create screen doubles as the edit
 * screen, so the same body shape is accepted and the totals are recalculated.
 */
const updateDB = async (id: string, userId: string, payload: TCreditNote) => {
  const existing = await CreditNoteModel.findOne({
    _id: id,
    user_id: userId,
    isDeleted: false,
  });
  if (!existing) throw new AppError(httpStatus.NOT_FOUND, 'Credit note not found');

  await validateDocumentParties(payload);

  if (Array.isArray(payload.product)) {
    for (const item of payload.product) {
      // A line may be free-text (no product_id) — the form lets the user type a
      // name instead of picking, so only validate the ones that reference one.
      if (item.product_id) {
        const product = (await ProductModel.findById(item.product_id)) as TProduct;
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
  if (Array.isArray(payload.service)) {
    for (const item of payload.service) {
      if (item.service_id) {
        const service = (await ServiceModel.findById(item.service_id)) as TService;
        if (!service) {
          throw new AppError(
            httpStatus.NOT_FOUND,
            'Service not found with id: ' + item.service_id
          );
        }
      }
      validateItemAmount(item, 'service');
    }
  }

  const totals = await calculateInvoice({
    ...existing.toObject(),
    ...payload,
  } as TCreditNote);
  const update: Record<string, unknown> = { ...payload, ...totals };
  // Ownership and soft-delete state are never client-controlled.
  delete update.user_id;
  delete update.isDeleted;

  const updated = await CreditNoteModel.findOneAndUpdate(
    { _id: id, user_id: userId },
    update,
    { new: true, runValidators: true }
  );
  return updated;
};

const deleteDraftDBOne = async (id: string, userId: string) => {
  const record = await CreditNoteModel.findOne({ _id: id, user_id: userId, isDeleted: false });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Credit note not found");
  if (record.status !== "Draft") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only draft credit notes can be deleted");
  }
  record.isDeleted = true;
  await record.save();
  return record;
};

const getSingleDB = async (id: string, userId: string) => {
  // Not pinned to isDeleted/isArchive false: the single view must open records
  // from the Trash and Archive tabs too (still scoped to the owner).
  const record = await CreditNoteModel.findOne({
    _id: id,
    user_id: userId,
    // Populate the customer so the single response carries the customer NAME
    // (read by "Duplicate as …").
  }).populate({ path: 'customer_id', select: CLIENT_POPULATE_SELECT });
  if (!record) {
    throw new AppError(httpStatus.NOT_FOUND, 'CreditNote not found');
  }
  return record;
};

const getAllDB = async (query: Record<string, unknown>, user_id: string) => {
  // isDeleted/isArchive are NOT hard-coded here: queryBuilder.filter() applies
  // buildSoftDeleteFilter, which defaults to "active only" and honours
  // ?isDeleted=true (Trash tab) and ?isArchive=true (Archive tab). Pinning them
  // here would override those tabs. paginate() counts the fully-filtered query.
  const buildQuery = new queryBuilder(
    CreditNoteModel.find({ user_id: user_id }).populate({
      path: 'customer_id',
      select: CLIENT_POPULATE_SELECT,
    }),
    query
  );

  // Search matches the note's own text, the free-text customer_name, AND the
  // picked customer (referenced User) — so `searchTerm` finds credit notes by
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
  const { totalData } = await buildQuery.paginate();
  const allRecords = await buildQuery.modelQuery.exec();
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query.limit) || 10;
  const pagination = buildQuery.calculatePagination({ totalData, currentPage, limit });
  return { allRecords, pagination };
};

const deleteDraftDB = withBulkDeleteId(deleteDraftDBOne);

export const creditNoteService = {
  createDB,
  getSingleDB,
  getAllDB,
  approveDB,
  deleteDraftDB,
  trashDB,
  hardDeleteDB,
  restoreDB,
  updateDB,
};


