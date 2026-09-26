import httpStatus from "http-status";
import { FilterQuery, Model, PopulateOptions } from "mongoose";
import AppError from "../../../errors/AppError";
import queryBuilder from "../../../builder/queryBuilder";
import { AuthRequest } from "../../../middlewares/auth";
import { TPermissionKey } from "../../../utils/permission";
import { parseDeleteIdsFromParam, runBulkDelete } from "../../../utils/bulkDelete";;
import {
  applyOwnershipToQuery,
  companyObjectId,
  companyScope,
  creatorObjectId,
  resolveCompanyId,
  resolveOwnership,
} from "./recruitment.utils";

export type RecruitmentCrudConfig<T> = {
  model: Model<T>;
  label: string;
  perms: { manageAny: TPermissionKey; manageOwn: TPermissionKey };
  searchFields: string[];
  populate?: PopulateOptions | PopulateOptions[] | string | string[];
  nameField?: string;
  /* eslint-disable no-unused-vars */
  beforeCreate?: (
    body: Record<string, unknown>,
    req: AuthRequest
  ) => Promise<Record<string, unknown>> | Record<string, unknown>;
  beforeUpdate?: (
    body: Record<string, unknown>,
    req: AuthRequest,
    id: string
  ) => Promise<Record<string, unknown>> | Record<string, unknown>;
  formatItem?: (doc: T) => unknown;
  /* eslint-enable no-unused-vars */
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withPopulate = (q: any, populate?: RecruitmentCrudConfig<unknown>["populate"]) =>
  populate ? q.populate(populate as PopulateOptions | (string | PopulateOptions)[]) : q;

/** Generic company-scoped + ownership-aware CRUD, mirroring the Laravel Recruitment controllers. */
export const createRecruitmentCrudService = <T>(config: RecruitmentCrudConfig<T>) => {
  const { model, label, perms, searchFields, populate, nameField } = config;

  const ownershipOf = (req: AuthRequest) =>
    resolveOwnership(req, perms.manageAny, perms.manageOwn);

  const fmt = (doc: T) => (config.formatItem ? config.formatItem(doc) : doc);

  const getOwned = async (req: AuthRequest, id: string) => {
    const companyId = resolveCompanyId(req);
    const base = applyOwnershipToQuery(
      { _id: id, ...companyScope(companyId) } as FilterQuery<T>,
      ownershipOf(req)
    );
    let q = model.findOne(base);
    q = withPopulate(q, populate);
    const doc = await q;
    if (!doc) throw new AppError(httpStatus.NOT_FOUND, `${label} not found`);
    return doc;
  };

  const create = async (req: AuthRequest, body: Record<string, unknown>) => {
    const companyId = resolveCompanyId(req);
    let payload = { ...body };
    if (config.beforeCreate) payload = await config.beforeCreate(payload, req);
    if (nameField && payload[nameField] !== undefined) {
      const name = String(payload[nameField]).trim();
      if (!name) throw new AppError(httpStatus.BAD_REQUEST, `${nameField} is required`);
      const dup = await model.findOne({
        ...companyScope(companyId),
        [nameField]: name,
      } as FilterQuery<T>);
      if (dup) throw new AppError(httpStatus.CONFLICT, `${label} already exists`);
    }
    const doc = await model.create({
      ...payload,
      user_id: companyObjectId(companyId),
      creator_id: creatorObjectId(req),
      isDeleted: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created = populate ? await (doc as any).populate(populate) : doc;
    return fmt(created as T);
  };

  const list = async (req: AuthRequest, query: Record<string, unknown>) => {
    const companyId = resolveCompanyId(req);
    const base = applyOwnershipToQuery(
      companyScope(companyId) as FilterQuery<T>,
      ownershipOf(req)
    );
    let mq = model.find(base);
    mq = withPopulate(mq, populate);
    const qb = new queryBuilder(mq, query)
      .search(searchFields as never)
      .filter()
      .sort()
      .fields();
    const { totalData } = await qb.paginate(model.find(base));
    const rows = await qb.modelQuery.exec();
    const data = rows.map((d) => fmt(d as T));
    const currentPage = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 10;
    const pagination = qb.calculatePagination({ totalData, currentPage, limit });
    return { data, pagination };
  };

  const single = async (req: AuthRequest, id: string) => fmt(await getOwned(req, id));

  const update = async (req: AuthRequest, id: string, body: Record<string, unknown>) => {
    await getOwned(req, id);
    let payload = { ...body };
    delete payload.user_id;
    delete payload.creator_id;
        if (config.beforeUpdate) payload = await config.beforeUpdate(payload, req, id);
    const companyId = resolveCompanyId(req);
    let q = model.findOneAndUpdate(
      { _id: id, ...companyScope(companyId) } as FilterQuery<T>,
      { $set: payload } as never,
      { new: true, runValidators: true }
    );
    q = withPopulate(q, populate);
    const updated = await q;
    if (!updated) throw new AppError(httpStatus.NOT_FOUND, `${label} not found`);
    return fmt(updated as T);
  };

  const removeOne = async (req: AuthRequest, oneId: string) => {
    await getOwned(req, oneId);
    const companyId = resolveCompanyId(req);
    await model.findOneAndUpdate(
      { _id: oneId, ...companyScope(companyId) } as FilterQuery<T>,
      { isDeleted: true } as never
    );
    return { _id: oneId };
  };

  const remove = async (req: AuthRequest, id: string) => {
    const ids = parseDeleteIdsFromParam(id);
    return runBulkDelete(ids, (oneId) => removeOne(req, oneId));
  };

  return { create, list, single, update, remove, getOwned, ownershipOf };
};
