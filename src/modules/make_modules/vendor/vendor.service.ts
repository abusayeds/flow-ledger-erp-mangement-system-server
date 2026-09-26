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
  VENDOR_ROLE_SET,
  mapPartySort,
  mergePartyUsersDB,
} from "../../../utils/partyUser";
import { PurchaseInvoiceModel } from "../purchase/purchaseInvoice/purchaseInvoice.model";

const vendorCreateDB = async (payload: TPartyUserWrite) => {
  const companyId = payload.user_id;
  if (!companyId) {
    throw new AppError(httpStatus.BAD_REQUEST, "user_id (company) is required");
  }
  validatePartyCreateBody(payload, role.vendor);
  return createOrPromotePartyUser(payload, companyId, role.vendor);
};

const allVendorDB = async (user_id: string, query: Record<string, unknown>) => {
  const baseFilter = partyBaseFilter(user_id, role.vendor, query);
  // company_name etc. live under businessProfile — translate before sorting.
  const mappedSort = mapPartySort(query.sort);
  const vendorQuery = new queryBuilder(
    UserModel.find(baseFilter),
    mappedSort ? { ...query, sort: mappedSort } : query,
    { softDelete: false }
  )
    .search([...PARTY_SEARCH_FIELDS])
    .filter()
    .sort()
    .fields();
  const { totalData } = await vendorQuery.paginate();
  const allVendor = (await vendorQuery.modelQuery.exec());
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query.limit) || 10;
  const pagination = vendorQuery.calculatePagination({
    totalData,
    currentPage,
    limit,
  });
  return { allVendor, pagination };
};
const VendorReturnList = async (
  user_id: string,
  query: Record<string, unknown>
) => {
  // Get all vendor ids who have purchase invoices
  const vendorIds = await PurchaseInvoiceModel.distinct("vendor_id", {
    user_id,
    isDeleted: false,
    status: { $nin: "draft" },
    vendor_id: { $ne: null },
  });

  const baseFilter = {
    ...partyBaseFilter(user_id, role.vendor, query),
    _id: { $in: vendorIds },
  };

  const vendorQuery = new queryBuilder(
    UserModel.find(baseFilter),
    query,
    { softDelete: false }
  )
    .search([...PARTY_SEARCH_FIELDS])
    .filter()
    .sort()
    .fields();

  const { totalData } = await vendorQuery.paginate();

  const allVendor = await vendorQuery.modelQuery.exec();

  const currentPage = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const pagination = vendorQuery.calculatePagination({
    totalData,
    currentPage,
    limit,
  });

  return {
    allVendor,
    pagination,
  };
};

const singleVendorDB = async (
  user_id: string,
  _id: string,
  _query: Record<string, unknown> = {}
): Promise<IUser | null> => {
  // Do not pin isArchive/isDeleted — detail/edit must open Archived + Trash rows.
  const doc = await UserModel.findOne({
    companyId: user_id,
    _id,
    role: { $in: [...VENDOR_ROLE_SET] },
  }).select("-password");
  if (!doc) return null;
  return toPartyUserResponse(doc);
};

const deleteVendorDB = async (user_id: string, payload: TPartyUserWrite) => {
  const update = applyPartyUpdateToUser({
    ...payload,
    isDeleted: payload.isDeleted ?? true,
    isArchive: payload.isArchive ?? true,
    active: false,
  });
  const res = await UserModel.findOneAndUpdate(
    { companyId: user_id, _id: payload._id, role: { $in: [...VENDOR_ROLE_SET] } },
    { $set: update },
    { new: true }
  ).select("-password");
  if (!res) {
    throw new AppError(httpStatus.NOT_FOUND, "Vendor not found");
  }
  return toPartyUserResponse(res);
};

const updateVendorDB = async (user_id: string, payload: TPartyUserWrite) => {
  const update = applyPartyUpdateToUser(payload);
  const res = await UserModel.findOneAndUpdate(
    { companyId: user_id, _id: payload._id, role: { $in: [...VENDOR_ROLE_SET] } },
    { $set: update },
    { new: true, runValidators: true }
  ).select("-password");
  if (!res) {
    throw new AppError(httpStatus.NOT_FOUND, "Vendor not found");
  }
  return toPartyUserResponse(res);
};

const mergeVendorsDB = (
  companyId: string,
  survivorId: string,
  mergedIds: string[],
) => mergePartyUsersDB(companyId, role.vendor, survivorId, mergedIds);

export const vendorService = {
  mergeVendorsDB,
  vendorCreateDB,
  allVendorDB,
  VendorReturnList,
  singleVendorDB,
  deleteVendorDB,
  updateVendorDB,
};
