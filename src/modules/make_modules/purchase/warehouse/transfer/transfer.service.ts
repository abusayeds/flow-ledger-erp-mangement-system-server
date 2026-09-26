import mongoose, { Types } from "mongoose";
import httpStatus from "http-status";
import AppError from "../../../../../errors/AppError";
import queryBuilder from "../../../../../builder/queryBuilder";
import { TStockTransfer } from "./transfer.interface";
import { StockTransferModel } from "./transfer.model";
import { ProductModel } from "../../../product/product.model";
import { WarehouseModel } from "../warehouse.model";
import { withBulkDeleteId } from "../../../../../utils/bulkDelete";

const assertPositiveIntegerQuantity = (quantity: unknown): number => {
  const n = Number(quantity);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
    throw new AppError(httpStatus.BAD_REQUEST, "quantity must be a positive integer");
  }
  return n;
};

const assertObjectIds = (from: Types.ObjectId | string, to: Types.ObjectId | string) => {
  if (String(from) === String(to)) {
    throw new AppError(httpStatus.BAD_REQUEST, "from_warehouse and to_warehouse must be different");
  }
};

const createTransferDB = async (payload: TStockTransfer) => {
  const user_id = payload.user_id;
  const quantity = assertPositiveIntegerQuantity(payload.quantity);
  assertObjectIds(payload.from_warehouse, payload.to_warehouse);

  const [fromWh, toWh] = await Promise.all([
    WarehouseModel.findOne({ _id: payload.from_warehouse, user_id, isDeleted: false }),
    WarehouseModel.findOne({ _id: payload.to_warehouse, user_id, isDeleted: false }),
  ]);
  if (!fromWh) {
    throw new AppError(httpStatus.NOT_FOUND, "Source warehouse not found");
  }
  if (!toWh) {
    throw new AppError(httpStatus.NOT_FOUND, "Destination warehouse not found");
  }

  if (!payload.date || Number.isNaN(new Date(payload.date as unknown as string).getTime())) {
    throw new AppError(httpStatus.BAD_REQUEST, "date must be a valid date");
  }

  // Free-text product (no id): record the transfer without moving stock.
  if (!payload.product_id) {
    if (!payload.product_name) {
      throw new AppError(httpStatus.BAD_REQUEST, "product_id or product_name is required");
    }
    const [doc] = await StockTransferModel.create([
      {
        user_id,
        product_name: payload.product_name,
        from_warehouse: payload.from_warehouse,
        to_warehouse: payload.to_warehouse,
        quantity,
        date: new Date(payload.date),
        notes: payload.notes,
      },
    ]);
    return await StockTransferModel.findById(doc._id)
      .populate("from_warehouse")
      .populate("to_warehouse");
  }

  const product = await ProductModel.findOne({
    _id: payload.product_id,
    user_id,
    isDeleted: false,
    isArchive: false,
  });
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  const onHand = product.stock?.onHandStock ?? 0;
  if (onHand < quantity) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Insufficient product stock: onHandStock is ${onHand}, transfer requests ${quantity}`
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const productUpdated = await ProductModel.findOneAndUpdate(
      {
        _id: payload.product_id,
        user_id,
        isDeleted: false,
        isArchive: false,
        "stock.onHandStock": { $gte: quantity },
      },
      { $inc: { "stock.onHandStock": -quantity } },
      { new: true, session }
    );
    if (!productUpdated) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Insufficient stock on product (onHandStock); another request may have updated stock"
      );
    }

    const committed = productUpdated.stock?.committedStock ?? 0;
    const newOnHand = productUpdated.stock?.onHandStock ?? 0;
    const availableForSale = Math.max(0, newOnHand - committed);

    await ProductModel.updateOne(
      { _id: payload.product_id, user_id },
      { $set: { "stock.availableForSale": availableForSale } },
      { session }
    );

    const [transferDoc] = await StockTransferModel.create(
      [
        {
          user_id,
          product_id: payload.product_id,
          from_warehouse: payload.from_warehouse,
          to_warehouse: payload.to_warehouse,
          quantity,
          date: new Date(payload.date),
          notes: payload.notes,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return await StockTransferModel.findById(transferDoc._id)
      .populate("product_id")
      .populate("from_warehouse")
      .populate("to_warehouse");
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const getAllTransferDB = async (query: Record<string, unknown>, user_id: string) => {
  // isDeleted is NOT hard-coded: queryBuilder.filter() applies buildSoftDeleteFilter
  // (active-only by default, honours ?isDeleted=true for the Trash tab).
  const buildQuery = new queryBuilder(
    StockTransferModel.find({ user_id })
      .populate("product_id", "productName sku stock")
      .populate("from_warehouse", "name city")
      .populate("to_warehouse", "name city"),
    query
  );

  // Search matches notes + the free-text product_name AND the referenced product
  // and both warehouses by name — so `searchTerm` finds transfers by product or
  // warehouse, not just notes. Awaited before filter/paginate.
  await buildQuery.searchNested({
    localFields: ["notes", "product_name"],
    refs: [
      {
        foreignField: "product_id",
        model: ProductModel as unknown as mongoose.Model<unknown>,
        fields: ["productName", "sku"],
        refFilter: { user_id },
      },
      {
        foreignField: "from_warehouse",
        model: WarehouseModel as unknown as mongoose.Model<unknown>,
        fields: ["name", "city"],
        refFilter: { user_id },
      },
      {
        foreignField: "to_warehouse",
        model: WarehouseModel as unknown as mongoose.Model<unknown>,
        fields: ["name", "city"],
        refFilter: { user_id },
      },
    ],
  });

  buildQuery.filter().sort().fields();

  const { totalData } = await buildQuery.paginate();

  const allTransfers = await buildQuery.modelQuery.exec();
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query.limit) || 10;
  const pagination = buildQuery.calculatePagination({ totalData, currentPage, limit });

  return { allTransfers, pagination };
};

const getSingleTransferDB = async (id: string, user_id: string) => {
  const doc = await StockTransferModel.findOne({ _id: id, user_id })
    .populate("product_id")
    .populate("from_warehouse")
    .populate("to_warehouse");
  if (!doc) {
    throw new AppError(httpStatus.NOT_FOUND, "Stock transfer not found");
  }
  return doc;
};

// NOTE: a stock transfer is a movement record; trashing it hides the record and
// does NOT reverse the moved quantities (same as the previous hard delete).
// Soft delete (isDeleted) makes it recoverable via restore and lets the Trash
// tab list it — a hard delete left the Trash tab permanently empty and the
// transfer unrecoverable.
const deleteTransferDBOne = async (id: string, user_id: string) => {
  const deleted = await StockTransferModel.findOneAndUpdate(
    { _id: id, user_id, isDeleted: { $ne: true } },
    { isDeleted: true },
    { new: true }
  );
  if (!deleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Stock transfer not found");
  }
  return deleted;
};

const deleteTransferDB = withBulkDeleteId(deleteTransferDBOne);

// Brings a trashed transfer back to the active list. Counterpart of the soft delete.
const restoreTransferDB = async (id: string, user_id: string) => {
  const restored = await StockTransferModel.findOneAndUpdate(
    { _id: id, user_id, isDeleted: true },
    { isDeleted: false },
    { new: true }
  );
  if (!restored) {
    throw new AppError(httpStatus.NOT_FOUND, "Stock transfer not found in Trash");
  }
  return restored;
};

export const transferService = {
  createTransferDB,
  getAllTransferDB,
  getSingleTransferDB,
  deleteTransferDB,
  restoreTransferDB,
};
