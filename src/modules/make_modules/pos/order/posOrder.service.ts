import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { ProductModel } from "../../product/product.model";
import { PosOrderModel, TPosOrder, TPosOrderItem } from "./posOrder.model";

const uid = (id: string) => new Types.ObjectId(id);

/** Recompute money fields from the line items so totals are authoritative. */
const computeTotals = (items: TPosOrderItem[], discount: number) => {
  const sub_total = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.price) || 0), 0);
  const tax = +items
    .reduce((s, i) => s + ((Number(i.quantity) || 0) * (Number(i.price) || 0) * (Number(i.tax_rate) || 0)) / 100, 0)
    .toFixed(2);
  const total = +(sub_total + tax - (Number(discount) || 0)).toFixed(2);
  return { sub_total: +sub_total.toFixed(2), tax, total };
};

const createDB = async (payload: Partial<TPosOrder>) => {
  const items = (payload.items || []) as TPosOrderItem[];
  if (!items.length) throw new AppError(httpStatus.BAD_REQUEST, "A POS order needs at least one item");
  const totals = computeTotals(items, Number(payload.discount) || 0);
  const data = {
    ...payload,
    discount: Number(payload.discount) || 0,
    ...totals,
    status: payload.status || "Completed",
    isDeleted: false,
  };
  const created = await PosOrderModel.create(data);

  for (const item of items) {
    if (!item.product_id) continue;
    const qty = Number(item.quantity) || 0;
    if (qty <= 0) continue;
    const prod = await ProductModel.findById(item.product_id);
    if (!prod?.stock) continue;
    const onHand = Math.max(0, (Number(prod.stock.onHandStock) || 0) - qty);
    const available = Math.max(0, (Number(prod.stock.availableForSale) || 0) - qty);
    prod.stock.onHandStock = onHand;
    prod.stock.availableForSale = available;
    await prod.save();
  }

  return created;
};

const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const buildQuery = new queryBuilder(
    PosOrderModel.find({ user_id: uid(userId), isDeleted: { $ne: true } }),
    query,
  )
    .search(["order_number", "customer_name", "warehouse"])
    .filter()
    .sort()
    .fields();
  const { totalData } = await buildQuery.paginate();
  const allRecords = await buildQuery.modelQuery.exec();
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query.limit) || 10;
  const pagination = buildQuery.calculatePagination({ totalData, currentPage, limit });
  return { allRecords, pagination };
};

const getSingleDB = async (id: string, userId: string) => {
  const record = await PosOrderModel.findOne({ _id: id, user_id: uid(userId), isDeleted: false });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "POS order not found");
  return record;
};

const deleteDB = async (id: string, userId: string) => {
  const record = await PosOrderModel.findOne({ _id: id, user_id: uid(userId), isDeleted: false });
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "POS order not found");
  record.isDeleted = true;
  await record.save();
  return record;
};

export const posOrderService = { createDB, getAllDB, getSingleDB, deleteDB };
