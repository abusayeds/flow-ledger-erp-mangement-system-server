import {
  bulkDeleteResponseData,
  parseDeleteIdsFromBody,
  parseDeleteIdsFromParam,
  runBulkDelete,
} from "./bulkDelete";

/** Params-based DELETE handlers (`/:id`). */
export const handleParamBulkDelete = async <T>(
  paramId: string | undefined,
  deleteOne: (id: string) => Promise<T>,
): Promise<{ ids: string[]; data: T | null }> => {
  const ids = parseDeleteIdsFromParam(paramId);
  const result = await runBulkDelete(ids, deleteOne);
  return { ids, data: bulkDeleteResponseData(ids, result) };
};

/** Body-based POST delete handlers. */
export const handleBodyBulkDelete = async <T>(
  body: Record<string, unknown>,
  keys: string | string[],
  deleteOne: (id: string) => Promise<T>,
): Promise<{ ids: string[]; data: T | null }> => {
  const ids = parseDeleteIdsFromBody(body, keys);
  const result = await runBulkDelete(ids, deleteOne);
  return { ids, data: bulkDeleteResponseData(ids, result) };
};
