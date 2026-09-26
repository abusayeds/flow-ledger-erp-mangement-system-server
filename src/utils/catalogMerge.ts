import httpStatus from "http-status";
import { Model, Schema, Types } from "mongoose";
import AppError from "../errors/AppError";

type SoftDeleteDoc = {
  _id?: Types.ObjectId | string;
  user_id?: Types.ObjectId | string;
  isDeleted?: boolean;
  isArchive?: boolean;
  stock?: {
    onHandStock?: number;
    committedStock?: number;
    availableForSale?: number;
    toBeInvoiced?: number;
    toBeBilled?: number;
  };
  quantity?: number;
};

/** Collect dotted paths that end with `field` (e.g. product_id / service_id). */
const collectFieldPaths = (schema: Schema, field: string, prefix = ""): string[] => {
  const out: string[] = [];
  schema.eachPath((pathname, schematype) => {
    const full = prefix ? `${prefix}.${pathname}` : pathname;
    if (pathname === field) out.push(full);
    const nested = (schematype as { schema?: Schema }).schema;
    if (nested) out.push(...collectFieldPaths(nested, field, full));
  });
  return out;
};

const rePointFieldAcrossModels = async (
  db: { models: Record<string, Model<unknown>> },
  userId: Types.ObjectId | string,
  field: "product_id" | "service_id",
  from: Types.ObjectId[],
  to: Types.ObjectId,
) => {
  const moved: Array<{ collection: string; path: string; updated: number }> = [];
  for (const name of Object.keys(db.models)) {
    const M = db.models[name];
    if (!M?.schema) continue;
    const paths = collectFieldPaths(M.schema, field);
    for (const path of paths) {
      const parts = path.split(".");
      let res: { modifiedCount?: number } | undefined;
      if (parts.length === 1) {
        res = await M.updateMany(
          { user_id: userId, [path]: { $in: from } },
          { $set: { [path]: to } },
        );
      } else if (parts.length === 2) {
        const [arr, leaf] = parts;
        res = await M.updateMany(
          { user_id: userId, [path]: { $in: from } },
          { $set: { [`${arr}.$[el].${leaf}`]: to } },
          { arrayFilters: [{ [`el.${leaf}`]: { $in: from } }] },
        );
      } else {
        continue;
      }
      const updated = res?.modifiedCount ?? 0;
      if (updated > 0) moved.push({ collection: name, path, updated });
    }
  }
  return moved;
};

/**
 * Merge catalog duplicates (products / services) into one survivor.
 * Re-points document line refs, optionally folds stock into the survivor,
 * then soft-deletes the merged rows.
 */
export const mergeCatalogItemsDB = async (opts: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Model: Model<any>;
  userId: string;
  survivorId: string;
  mergedIdsRaw: string[];
  label: string;
  refField: "product_id" | "service_id";
  foldStock?: boolean;
}) => {
  const {
    Model,
    userId,
    survivorId,
    mergedIdsRaw,
    label,
    refField,
    foldStock = false,
  } = opts;

  const mergedIds = [...new Set((mergedIdsRaw || []).map(String))].filter(
    (id) => id && id !== String(survivorId),
  );
  if (!survivorId) {
    throw new AppError(httpStatus.BAD_REQUEST, "survivor_id is required");
  }
  if (mergedIds.length === 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "merged_ids must contain at least one other id",
    );
  }

  const scope = { user_id: userId, isDeleted: { $ne: true } };
  const survivor = (await Model.findOne({ ...scope, _id: survivorId })) as SoftDeleteDoc | null;
  if (!survivor) {
    throw new AppError(httpStatus.NOT_FOUND, `${label} to merge into was not found`);
  }

  const found = (await Model.find({ ...scope, _id: { $in: mergedIds } })) as SoftDeleteDoc[];
  if (found.length !== mergedIds.length) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      `One or more ${label.toLowerCase()}s to merge were not found`,
    );
  }

  const from = mergedIds.map((id) => new Types.ObjectId(id));
  const to = new Types.ObjectId(String(survivorId));

  const moved = await rePointFieldAcrossModels(Model.db, userId, refField, from, to);

  if (foldStock) {
    const stock = {
      onHandStock: Number(survivor.stock?.onHandStock ?? 0),
      committedStock: Number(survivor.stock?.committedStock ?? 0),
      availableForSale: Number(survivor.stock?.availableForSale ?? 0),
      toBeInvoiced: Number(survivor.stock?.toBeInvoiced ?? 0),
      toBeBilled: Number(survivor.stock?.toBeBilled ?? 0),
    };
    let quantity = Number(survivor.quantity ?? 0);
    for (const row of found) {
      stock.onHandStock += Number(row.stock?.onHandStock ?? 0);
      stock.committedStock += Number(row.stock?.committedStock ?? 0);
      stock.availableForSale += Number(row.stock?.availableForSale ?? 0);
      stock.toBeInvoiced += Number(row.stock?.toBeInvoiced ?? 0);
      stock.toBeBilled += Number(row.stock?.toBeBilled ?? 0);
      quantity += Number(row.quantity ?? 0);
    }
    await Model.updateOne(
      { _id: survivor._id, user_id: userId },
      { $set: { stock, quantity } },
    );
  }

  await Model.updateMany(
    { user_id: userId, _id: { $in: from } },
    { $set: { isDeleted: true, isArchive: true } },
  );

  const refreshed = await Model.findById(survivor._id);

  return {
    survivor: refreshed,
    merged_ids: mergedIds,
    documents_moved: moved.reduce((sum, m) => sum + m.updated, 0),
    details: moved,
  };
};
