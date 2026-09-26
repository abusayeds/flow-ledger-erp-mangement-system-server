import httpStatus from "http-status";
import { FilterQuery, Model, PopulateOptions, Types } from "mongoose";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { AuthRequest } from "../../../../middlewares/auth";
import { TPermissionKey } from "../../../../utils/permission";
import { parseDeleteIdsFromParam, runBulkDelete } from "../../../../utils/bulkDelete";;
import {
  applyOwnershipToQuery,
  companyScope,
  creatorObjectId,
  resolveCompanyId,
  resolveOwnership,
} from "./hrm.utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HrmCrudConfig<T = any> = {
  model: Model<T>;
  resourceLabel: string;
  permissions: {
    manage: TPermissionKey;
    manageAny: TPermissionKey;
    manageOwn: TPermissionKey;
    create: TPermissionKey;
    edit: TPermissionKey;
    delete: TPermissionKey;
  };
  searchFields: string[];
  nameField?: string;
  populate?: PopulateOptions | PopulateOptions[] | string | string[];
  beforeCreate?: (body: Record<string, unknown>, req: AuthRequest) => Promise<Record<string, unknown>> | Record<string, unknown>;
  beforeUpdate?: (body: Record<string, unknown>, req: AuthRequest) => Promise<Record<string, unknown>> | Record<string, unknown>;
  formatItem?: (doc: T) => unknown;
};

const leanDoc = <T>(doc: T & { _id?: Types.ObjectId }) => ({
  ...(doc as object),
  _id: doc._id ? String(doc._id) : undefined,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applyPopulate = (q: any, populate?: PopulateOptions | PopulateOptions[] | string | string[]) => {
  if (!populate) return q;
  return q.populate(populate as PopulateOptions | (string | PopulateOptions)[]);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createHrmCrudService = <T = any>(config: HrmCrudConfig<T>) => {
  
  const { model, permissions: p, searchFields, resourceLabel, populate, nameField } = config;
  const getById = async (companyId: string, id: string, req: AuthRequest) => {
    const ownership = resolveOwnership(req, p.manageAny, p.manageOwn);
    let q = model.findOne({ _id: id, ...companyScope(companyId) });
    q = applyPopulate(q, populate);
    const doc = await q.lean();
    if (!doc) throw new AppError(httpStatus.NOT_FOUND, `${resourceLabel} not found`);
    const filtered = applyOwnershipToQuery({ _id: doc._id }, ownership);
    const allowed = await model.findOne(filtered as FilterQuery<T>).select("_id").lean();
    if (!allowed) throw new AppError(httpStatus.FORBIDDEN, "Permission denied");
    return config.formatItem ? config.formatItem(doc as T) : leanDoc(doc as Record<string, unknown>);
  };

  const list = async (companyId: string, query: Record<string, unknown>, req: AuthRequest) => {
    const ownership = resolveOwnership(req, p.manageAny, p.manageOwn);
    const base = applyOwnershipToQuery(companyScope(companyId) as FilterQuery<T>, ownership);
    let mq = model.find(base);
    mq = applyPopulate(mq, populate);
    const qb = new queryBuilder(mq, query).search(searchFields as never).filter().sort().fields();
    const { totalData } = await qb.paginate(model.find(base));
    const rows = await qb.modelQuery.lean().exec();
    const data = (rows as T[]).map((d) =>
      config.formatItem ? config.formatItem(d) : leanDoc(d as unknown as Record<string, unknown>)
    );
    const currentPage = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 10;
    const pagination = qb.calculatePagination({ totalData, currentPage, limit });
    return { data, pagination };
  };

  const create = async (companyId: string, body: Record<string, unknown>, req: AuthRequest) => {
    let payload = { ...body };
    if (config.beforeCreate) payload = await config.beforeCreate(payload, req);
    if (nameField && payload[nameField] !== undefined) {
      const name = String(payload[nameField]).trim();
      if (!name) throw new AppError(httpStatus.BAD_REQUEST, `${nameField} is required`);
      const dup = await model.findOne({ ...companyScope(companyId), [nameField]: name, isDeleted: false });
      if (dup) throw new AppError(httpStatus.CONFLICT, `${resourceLabel} already exists`);
    }
    const doc = await model.create({
      ...payload,
      user_id: new Types.ObjectId(companyId),
      creator_id: creatorObjectId(req),
      isDeleted: false,
    });
    return leanDoc(doc.toObject() as unknown as Record<string, unknown>);
  };

  const update = async (companyId: string, id: string, body: Record<string, unknown>, req: AuthRequest) => {
    await getById(companyId, id, req);
    let payload = { ...body };
    delete payload.user_id;
    delete payload.creator_id;
        if (config.beforeUpdate) payload = await config.beforeUpdate(payload, req);
    const updated = await model.findOneAndUpdate(
      { _id: id, ...companyScope(companyId) },
      { $set: payload } as never,
      { new: true, runValidators: true }
    ).lean();
    if (!updated) throw new AppError(httpStatus.NOT_FOUND, `${resourceLabel} not found`);
    const obj = updated as unknown as T & { _id?: Types.ObjectId };
    return config.formatItem ? config.formatItem(obj) : leanDoc(obj as Record<string, unknown>);
  };

  const removeOne = async (companyId: string, oneId: string, req: AuthRequest) => {
    await getById(companyId, oneId, req);
    await model.findOneAndUpdate({ _id: oneId, ...companyScope(companyId) }, { isDeleted: true });
    return { _id: oneId };
  };

  const remove = async (companyId: string, id: string, req: AuthRequest) => {
    const ids = parseDeleteIdsFromParam(id);
    return runBulkDelete(ids, (oneId) => removeOne(companyId, oneId, req));
  };

  return {
    list: (req: AuthRequest, query: Record<string, unknown>) =>
      list(resolveCompanyId(req), query, req),
    get: (req: AuthRequest, id: string) => getById(resolveCompanyId(req), id, req),
    create: (req: AuthRequest, body: Record<string, unknown>) =>
      create(resolveCompanyId(req), body, req),
    update: (req: AuthRequest, id: string, body: Record<string, unknown>) =>
      update(resolveCompanyId(req), id, body, req),
    remove: (req: AuthRequest, id: string) => remove(resolveCompanyId(req), id, req),
  };
};
