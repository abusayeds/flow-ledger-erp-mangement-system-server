import { TResponse } from "../interface/global.interface";

/** Matches `queryBuilder.calculatePagination()` — totalData lives in pagination, not beside data. */
export type PaginationMeta = NonNullable<TResponse<unknown>["pagination"]>;

export type PaginatedListResult<T> = {
  data: T[];
  pagination: PaginationMeta;
};

const isPaginationMeta = (value: unknown): value is PaginationMeta =>
  typeof value === "object" &&
  value !== null &&
  "totalPage" in value &&
  "currentPage" in value &&
  "totalData" in value;


export const extractPaginatedList = <T>(
  payload: Record<string, unknown>
): PaginatedListResult<T> | null => {
  const pagination = payload.pagination;
  if (!isPaginationMeta(pagination)) return null;

  if (Array.isArray(payload.data)) {
    return { data: payload.data as T[], pagination };
  }

  const listKeys = Object.keys(payload).filter(
    (key) =>
      key !== "pagination" &&
      key !== "totalData" &&
      Array.isArray(payload[key])
  );

  if (listKeys.length !== 1) return null;

  return { data: payload[listKeys[0]] as T[], pagination };
};

/** Flattens nested `{ pagination, <listKey>: [] }` into top-level pagination + data array. */
export const normalizePaginatedResponse = <T>(
  response: TResponse<T>
): TResponse<unknown> => {
  if (response.pagination !== undefined) {
    return response as TResponse<unknown>;
  }

  if (
    !response.data ||
    typeof response.data !== "object" ||
    Array.isArray(response.data)
  ) {
    return response as TResponse<unknown>;
  }

  const extracted = extractPaginatedList(
    response.data as Record<string, unknown>
  );
  if (!extracted) {
    return response as TResponse<unknown>;
  }

  return {
    ...response,
    pagination: extracted.pagination,
    data: extracted.data,
  };
};
