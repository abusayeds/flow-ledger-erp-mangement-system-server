import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { TWarehouse } from "./warehouse.interface";
import { WarehouseModel } from "./warehouse.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const createWarehouseDB = async (payload: TWarehouse) => {
  const result = await WarehouseModel.create(payload);
  return result;
};

const getAllWarehouseDB = async (query: Record<string, unknown>, user_id: string) => {
  // isDeleted is NOT hard-coded here: queryBuilder.filter() applies
  // buildSoftDeleteFilter, which defaults to "active only" and honours
  // ?isDeleted=true (Trash tab). Pinning it false made the Trash tab always
  // empty. paginate() counts the fully-filtered query.
  const base = { user_id };
  const buildQuery = new queryBuilder(WarehouseModel.find(base), query)
    .search(["name", "address", "city", "zip_code", "phone", "email"])
    .filter()
    .sort()
    .fields();

  const { totalData } = await buildQuery.paginate();
  const allWarehouse = await buildQuery.modelQuery.exec();
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query.limit) || 10;
  const pagination = buildQuery.calculatePagination({ totalData, currentPage, limit });

  return { allWarehouse, pagination };
};

const getSingleWarehouseDB = async (id: string, user_id: string) => {
  const warehouse = await WarehouseModel.findOne({ _id: id, user_id, isDeleted: false });
  if (!warehouse) {
    throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found");
  }
  return warehouse;
};

const updateWarehouseDB = async (id: string, user_id: string, payload: Partial<TWarehouse>) => {
  delete payload.user_id;
  const warehouse = await WarehouseModel.findOneAndUpdate(
    { _id: id, user_id },
    payload,
    { new: true, runValidators: true }
  );
  if (!warehouse) {
    throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found");
  }
  return warehouse;
};

const deleteWarehouseDBOne = async (id: string, user_id: string) => {
  const warehouse = await WarehouseModel.findOneAndUpdate(
    { _id: id, user_id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!warehouse) {
    throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found");
  }
  return warehouse;
};

const deleteWarehouseDB = withBulkDeleteId(deleteWarehouseDBOne);

// `delete` is a soft delete (isDeleted: true); restore brings a trashed
// warehouse back to the active list. Counterpart of deleteWarehouseDBOne.
const restoreWarehouseDB = async (id: string, user_id: string) => {
  const warehouse = await WarehouseModel.findOneAndUpdate(
    { _id: id, user_id, isDeleted: true },
    { isDeleted: false },
    { new: true }
  );
  if (!warehouse) {
    throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found in Trash");
  }
  return warehouse;
};

export const warehouseService = {
  createWarehouseDB,
  getAllWarehouseDB,
  getSingleWarehouseDB,
  updateWarehouseDB,
  deleteWarehouseDB,
  restoreWarehouseDB,
};
