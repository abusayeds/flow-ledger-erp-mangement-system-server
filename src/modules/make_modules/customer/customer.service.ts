import httpStatus from "http-status";
import queryBuilder from "../../../builder/queryBuilder";
import { TPartyUserWrite } from "../../basic_modules/user/user.business.interface";
import { IUser } from "../../basic_modules/user/user.interface";
import { UserModel } from "../../basic_modules/user/user.model";
import AppError from "../../../errors/AppError";
import {
  buildPartyUserForCreate,
  createOrPromotePartyUser,
  validatePartyCreateBody,
  applyPartyUpdateToUser,
  partyBaseFilter,
  PARTY_SEARCH_FIELDS,
  PARTY_LIST_SELECT,
  role,
  toPartyUserResponse,
  toPartyListItem,
  CUSTOMER_ROLE_SET,
  mapPartySort,
  mergePartyUsersDB,
} from "../../../utils/partyUser";
import { InvoiceModel } from "../invoice/invoice.model";

const customerCreateDB = async (payload: TPartyUserWrite) => {
  const companyId = payload.user_id;
  if (!companyId) {
    throw new AppError(httpStatus.BAD_REQUEST, "user_id (company) is required");
  }
  validatePartyCreateBody(payload, role.customer);
  return createOrPromotePartyUser(payload, companyId, role.customer);
};

const allCustomerDB = async (user_id: string, query: Record<string, unknown>) => {
  const baseFilter = partyBaseFilter(user_id, role.customer, query);
  // company_name etc. live under businessProfile — translate before sorting.
  const mappedSort = mapPartySort(query.sort);
  const customerQuery = new queryBuilder(
    UserModel.find(baseFilter).select(PARTY_LIST_SELECT),
    mappedSort ? { ...query, sort: mappedSort } : query,
    { softDelete: false }
  )
    .search([...PARTY_SEARCH_FIELDS])
    .filter()
    .sort()
    .fields();
  const { totalData } = await customerQuery.paginate();

  const allCustomer = (await customerQuery.modelQuery.exec()).map(toPartyListItem);
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query.limit) || 10;
  const pagination = customerQuery.calculatePagination({
    totalData,
    currentPage,
    limit,
  });
  return { allCustomer, pagination };
};

/**
 * Full-document customer list — same filters/pagination as [allCustomerDB] but
 * returns the complete party document (nested businessProfile + currency +
 * addresses) instead of the trimmed list projection. Used by the web `/customers`
 * REST alias so the web can hydrate its detail/edit form from the list in one
 * request. The mobile `/customer/all` route keeps using the trimmed list.
 */
const allCustomerFullDB = async (
  user_id: string,
  query: Record<string, unknown>
) => {
  const baseFilter = partyBaseFilter(user_id, role.customer, query);
  const mappedSort = mapPartySort(query.sort);
  const customerQuery = new queryBuilder(
    UserModel.find(baseFilter)
      .select("-password")
      .populate("businessProfile.default_tax_service_id", "name rate type")
      .populate("businessProfile.default_tax_product_id", "name rate type"),
    mappedSort ? { ...query, sort: mappedSort } : query,
    { softDelete: false }
  )
    .search([...PARTY_SEARCH_FIELDS])
    .filter()
    .sort()
    .fields();
  const { totalData } = await customerQuery.paginate();
  const allCustomer = (await customerQuery.modelQuery.exec()).map(
    toPartyUserResponse
  );
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query.limit) || 10;
  const pagination = customerQuery.calculatePagination({
    totalData,
    currentPage,
    limit,
  });
  return { allCustomer, pagination };
};
const invoiceCustomerList = async (
  user_id: string,
  query: Record<string, unknown>
) => {
  // Invoice filter. Only invoices that have at least one PRODUCT line count —
  // this endpoint feeds the invoice-return customer picker, and a return needs
  // returnable products, so customers whose invoices carry no products are
  // excluded ("product.0" exists ⇒ the product array is non-empty).
  const invoiceFilter: Record<string, unknown> = {
    user_id,
    isDeleted: false,
    isArchive: false,
    "product.0": { $exists: true },
  };

  // Example: if you have invoice type
  if (query.type) {
    invoiceFilter.type = query.type;
  }

  // Get unique customer ids that have (product-bearing) invoices
  const customerIds = await InvoiceModel.distinct(
    "customer_id",
    invoiceFilter
  );

  const baseFilter = {
    ...partyBaseFilter(user_id, role.customer, query),
    _id: { $in: customerIds },
  };

  const customerQuery = new queryBuilder(
    UserModel.find(baseFilter).select(PARTY_LIST_SELECT),
    query,
    { softDelete: false }
  )
    .search([...PARTY_SEARCH_FIELDS])
    .filter()
    .sort()
    .fields();

  const { totalData } = await customerQuery.paginate();

  const allCustomer = (await customerQuery.modelQuery.exec()).map(toPartyListItem);

  const currentPage = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const pagination = customerQuery.calculatePagination({
    totalData,
    currentPage,
    limit,
  });

  return { allCustomer, pagination };
};

const singleCustomerDB = async (
  user_id: string,
  _id: string,
  _query: Record<string, unknown> = {}
): Promise<IUser | null> => {
  // Do not pin isArchive/isDeleted — detail/edit must open Archived + Trash rows.
  const doc = await UserModel.findOne({
    companyId: user_id,
    _id,
    role: { $in: [...CUSTOMER_ROLE_SET] },
  })
    .populate("businessProfile.default_tax_service_id", "name rate type")
    .populate("businessProfile.default_tax_product_id", "name rate type")
    .select("-password");
  if (!doc) return null;
  return toPartyUserResponse(doc);
};

const deleteCustomerDB = async (user_id: string, payload: TPartyUserWrite) => {
  const update = applyPartyUpdateToUser({
    ...payload,
    isDeleted: payload.isDeleted ?? true,
    isArchive: payload.isArchive ?? true,
    active: false,
  });
  const res = await UserModel.findOneAndUpdate(
    {
      companyId: user_id,
      _id: payload._id,
      role: { $in: [...CUSTOMER_ROLE_SET] },
    },
    { $set: update },
    { new: true }
  ).select("-password");
  if (!res) {
    throw new AppError(httpStatus.NOT_FOUND, "Customer not found");
  }
  return toPartyUserResponse(res);
};

/** Permanent remove from Trash — deletes the User row (already soft-deleted). */
const hardDeleteCustomerDB = async (user_id: string, id: string) => {
  const removed = await UserModel.findOneAndDelete({
    companyId: user_id,
    _id: id,
    role: { $in: [...CUSTOMER_ROLE_SET] },
    isDeleted: true,
  }).select("-password");
  if (!removed) {
    throw new AppError(httpStatus.NOT_FOUND, "Customer not found in Trash");
  }
  return toPartyUserResponse(removed);
};

/** Restore a trashed customer back to the Active list. */
const restoreCustomerDB = async (user_id: string, id: string) => {
  const res = await UserModel.findOneAndUpdate(
    {
      companyId: user_id,
      _id: id,
      role: { $in: [...CUSTOMER_ROLE_SET] },
      isDeleted: true,
    },
    {
      $set: {
        isDeleted: false,
        "businessProfile.isArchive": false,
        "businessProfile.active": true,
      },
    },
    { new: true }
  ).select("-password");
  if (!res) {
    throw new AppError(httpStatus.NOT_FOUND, "Customer not found in Trash");
  }
  return toPartyUserResponse(res);
};

const updateCustomerDB = async (user_id: string, payload: TPartyUserWrite) => {
  const update = applyPartyUpdateToUser(payload);
  const res = await UserModel.findOneAndUpdate(
    {
      companyId: user_id,
      _id: payload._id,
      role: { $in: [...CUSTOMER_ROLE_SET] }
    },
    { $set: update },
    { new: true, runValidators: true }
  ).select("-password");
  if (!res) {
    throw new AppError(httpStatus.NOT_FOUND, "Customer not found");
  }
  return toPartyUserResponse(res);
};

const mergeCustomersDB = (
  companyId: string,
  survivorId: string,
  mergedIds: string[],
) => mergePartyUsersDB(companyId, role.customer, survivorId, mergedIds);

export const customerService = {
  mergeCustomersDB,
  customerCreateDB,
  allCustomerDB,
  allCustomerFullDB,
  invoiceCustomerList,
  singleCustomerDB,
  deleteCustomerDB,
  hardDeleteCustomerDB,
  restoreCustomerDB,
  updateCustomerDB,
};
