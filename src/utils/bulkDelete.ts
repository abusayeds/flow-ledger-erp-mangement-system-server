import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../errors/AppError";

const dedupeIds = (ids: string[]): string[] => [...new Set(ids)];

const assertValidObjectIds = (ids: string[]) => {
  for (const id of ids) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError(httpStatus.BAD_REQUEST, `Invalid id: ${id}`);
    }
  }
};

/** `DELETE .../:id` — single id unchanged; multiple via comma-separated ids. */
export const parseDeleteIdsFromParam = (raw: string | undefined): string[] => {
  if (!raw?.trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, "Id is required");
  }

  const ids = dedupeIds(
    raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  );

  if (!ids.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "Id is required");
  }

  assertValidObjectIds(ids);
  return ids;
};

/**
 * `POST .../delete` body — string, comma-separated string, or string[].
 * Tries keys in order; first present key wins.
 */
export const parseDeleteIdsFromBody = (
  body: Record<string, unknown>,
  keys: string | string[],
): string[] => {
  const keyList = Array.isArray(keys) ? keys : [keys];
  let raw: unknown;

  for (const key of keyList) {
    const value = body[key];
    if (value !== undefined && value !== null && value !== "") {
      raw = value;
      break;
    }
  }

  if (raw === undefined) {
    throw new AppError(httpStatus.BAD_REQUEST, "Id is required");
  }

  let ids: string[];
  if (Array.isArray(raw)) {
    ids = raw.map((entry) => String(entry).trim()).filter(Boolean);
  } else if (typeof raw === "string") {
    ids = raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  } else {
    ids = [String(raw).trim()].filter(Boolean);
  }

  ids = dedupeIds(ids);
  if (!ids.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "Id is required");
  }

  assertValidObjectIds(ids);
  return ids;
};

/** Body ids as comma-separated string for second-arg bulk delete services. */
export const joinDeleteIdsFromBody = (
  body: Record<string, unknown>,
  keys: string | string[],
): string => parseDeleteIdsFromBody(body, keys).join(",");

/**
 * Single id → returns deleteOne result (unchanged API data).
 * Multiple ids → runs all deletes; returns null (Q1-A). Any failure aborts (Q2-A).
 */
export const runBulkDelete = async <T>(
  ids: string[],
  deleteOne: (id: string) => Promise<T>,
): Promise<T | null> => {
  if (ids.length === 1) {
    return deleteOne(ids[0]);
  }

  for (const id of ids) {
    await deleteOne(id);
  }

  return null;
};

/** Use when single-delete response includes a data payload. */
export const bulkDeleteResponseData = <T>(
  ids: string[],
  singleResult: T | null | undefined,
): T | null => (ids.length === 1 ? (singleResult ?? null) : null);

/** Wrap a delete handler whose first argument is the entity id (params-based APIs). */
export const withBulkDeleteId = <T, Rest extends unknown[]>(
  deleteOne: (id: string, ...rest: Rest) => Promise<T>,
): ((id: string, ...rest: Rest) => Promise<T | null>) => {
  return async (id: string, ...rest: Rest) =>
    runBulkDelete(parseDeleteIdsFromParam(id), (oneId) => deleteOne(oneId, ...rest));
};

/** Wrap when id is the second argument (e.g. removeDB(userId, id)). */
export const withBulkDeleteIdSecond = <T>(
  deleteOne: (scopeId: string, id: string) => Promise<T>,
): ((scopeId: string, id: string) => Promise<T | null>) => {
  return async (scopeId: string, id: string) =>
    runBulkDelete(parseDeleteIdsFromParam(id), (oneId) => deleteOne(scopeId, oneId));
};

/** Wrap when id is the third argument (e.g. removeSub(parentId, userId, childId)). */
export const withBulkDeleteIdThird = <T>(
  deleteOne: (a: string, b: string, id: string) => Promise<T> | T,
): ((a: string, b: string, id: string) => Promise<T | null>) => {
  return async (a, b, id) =>
    runBulkDelete(parseDeleteIdsFromParam(id), async (oneId) => deleteOne(a, b, oneId));
};

/** Wrap AuthRequest + id style delete handlers (support ticket, etc.). */
export const withBulkDeleteAuthId = <T>(
  deleteOne: (req: import("../middlewares/auth").AuthRequest, id: string) => Promise<T>,
): ((req: import("../middlewares/auth").AuthRequest, id: string) => Promise<T | null>) => {
  return async (req, id) =>
    runBulkDelete(parseDeleteIdsFromParam(id), (oneId) => deleteOne(req, oneId));
};

/** Wrap AuthRequest + parent id + child id (comma-separated child ids). */
export const withBulkDeleteAuthChildId = <T>(
  deleteOne: (
    req: import("../middlewares/auth").AuthRequest,
    parentId: string,
    childId: string,
  ) => Promise<T>,
): ((
  req: import("../middlewares/auth").AuthRequest,
  parentId: string,
  childId: string,
) => Promise<T | null>) => {
  return async (req, parentId, childId) =>
    runBulkDelete(parseDeleteIdsFromParam(childId), (oneChildId) =>
      deleteOne(req, parentId, oneChildId),
    );
};
