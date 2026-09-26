import { FilterQuery, Model, Query } from "mongoose";

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const QUERY_META_KEYS = new Set([
  "searchTerm",
  "sort",
  "limit",
  "page",
  "fields",
  "startDate",
  "endDate",
  "from",
  "to",
  // Document-date range (filters a document's own date field, e.g. `date`,
  // not createdAt). `dateField` names the field (default "date").
  "dateFrom",
  "dateTo",
  "dateField",
  "isDeleted",
  "isArchive",
]);

const SOFT_DELETE_KEYS = ["isDeleted", "isArchive"] as const;

export type QueryBuilderOptions = {
  /** Default true — hides deleted/archived unless ?isDeleted=true or ?isArchive=true */
  softDelete?: boolean;
};

export const parseBoolQuery = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
};

/** Default: not deleted & not archived. Query ?isDeleted=true / ?isArchive=true shows those rows. */
export const buildSoftDeleteFilter = (
  query: Record<string, unknown>
): FilterQuery<unknown> => {
  const filter: FilterQuery<unknown> = {};

  for (const key of SOFT_DELETE_KEYS) {
    const parsed = parseBoolQuery(query[key]);
    if (parsed === true) {
      filter[key] = true;
    } else {
      // false, missing, or invalid — hide flagged rows ($ne: true keeps false + missing fields)
      filter[key] = { $ne: true };
    }
  }

  return filter;
};

/** Two raw date strings → an inclusive `{ $gte, $lte }` calendar-day range. */
const parseDayRange = (startRaw: unknown, endRaw: unknown) => {
  const startStr = typeof startRaw === "string" ? startRaw.trim() : "";
  const endStr = typeof endRaw === "string" ? endRaw.trim() : "";
  if (!startStr && !endStr) return null;

  const dateFilter: Record<string, Date> = {};
  if (startStr) {
    const start = startOfDay(new Date(startStr));
    if (!Number.isNaN(start.getTime())) dateFilter.$gte = start;
  }
  if (endStr) {
    const end = endOfDay(new Date(endStr));
    if (!Number.isNaN(end.getTime())) dateFilter.$lte = end;
  }
  return Object.keys(dateFilter).length ? dateFilter : null;
};

/** `startDate`/`endDate` or `from`/`to` → createdAt range (inclusive calendar days). */
const parseCreatedAtRange = (query: Record<string, unknown>) =>
  parseDayRange(query.startDate ?? query.from, query.endDate ?? query.to);

/** `dateFrom`/`dateTo` → a range on the document's own date field (`dateField`, default "date"). */
const parseDocDateRange = (query: Record<string, unknown>) => {
  const range = parseDayRange(query.dateFrom, query.dateTo);
  if (!range) return null;
  const raw = typeof query.dateField === "string" ? query.dateField.trim() : "";
  return { field: raw || "date", range };
};

/** Comma-separated filter value → `{ $in: [...] }`; single value passes through. */
const expandMultiValue = (value: unknown): unknown => {
  if (typeof value === "string" && value.includes(",")) {
    const parts = value.split(",").map((v) => v.trim()).filter(Boolean);
    if (parts.length > 1) return { $in: parts };
    if (parts.length === 1) return parts[0];
  }
  return value;
};

/** Search a related collection by text, then match main docs via ObjectId field. */
export type NestedSearchRef = {
  /** ObjectId field on the main document (e.g. `employee_user_id`). */
  foreignField: string;
  model: Model<unknown>;
  /** Top-level string fields on the referenced collection. */
  fields?: string[];
  /** Dot-path string fields (e.g. `businessProfile.companyName`). */
  dotFields?: string[];
  /** Always applied when querying the referenced collection. */
  refFilter?: FilterQuery<unknown>;
};

export type SearchNestedOptions<T> = {
  /** Same-collection fields (regex), like `.search()`. */
  localFields?: Array<keyof T | string>;
  /** Related collections — two-step lookup by `searchTerm`. */
  refs?: NestedSearchRef[];
};

class queryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public query: Record<string, unknown>;
  private softDeleteEnabled: boolean;

  constructor(
    modelQuery: Query<T[], T>,
    Query: Record<string, unknown>,
    options: QueryBuilderOptions = {}
  ) {
    this.modelQuery = modelQuery;
    this.query = Query;
    this.softDeleteEnabled = options.softDelete !== false;
  }

  /** Models without isDeleted/isArchive — skip auto soft-delete filtering. */
  withoutSoftDelete(): this {
    this.softDeleteEnabled = false;
    return this;
  }
  search(searchableFields: Array<keyof T>): this {
    const searchTerm = this.query.searchTerm;
    if (typeof searchTerm === 'string') {
      const keywords: string[] = searchTerm
        .trim()
        .split(/\s+/) 
        .filter(Boolean); 
      if (keywords.length > 0) {
        const andConditions = keywords.map((keyword: string) => ({
          $or: searchableFields.map((field: keyof T) => ({
            [field]: { $regex: keyword, $options: "i" },
          })),
        }));
        this.modelQuery = this.modelQuery.find({
          $and: andConditions,
        });
      }
    }
    return this;
  }

  /**
   * Search on local fields + nested/referenced collections (two-step).
   * Uses `searchTerm` from query string — same as `.search()`.
   * Must be awaited before `.filter()` / `.paginate()`.
   *
   * @example
   * await qb.searchNested({
   *   localFields: ["employee_id", "city"],
   *   refs: [{
   *     foreignField: "ref _id",
   *     model: exampleModel,
   *     fields: ["name", "email", "phone"],
   *     refFilter: { companyId, isDeleted: false },
   *   }],
   * });
   */
  async searchNested(options: SearchNestedOptions<T> = {}): Promise<this> {
    const searchTerm = this.query.searchTerm;
    if (typeof searchTerm !== "string") return this; 

    const keywords = searchTerm.trim().split(/\s+/).filter(Boolean);
    if (keywords.length === 0) return this;

    const { localFields = [], refs = [] } = options;
    const andConditions: FilterQuery<T>[] = [];

    for (const keyword of keywords) {
      const orConditions: FilterQuery<T>[] = [];

      for (const field of localFields) {
        orConditions.push({
          [field]: { $regex: keyword, $options: "i" },
        } as FilterQuery<T>);
      }

      for (const ref of refs) {
        const refOr: FilterQuery<unknown>[] = [];
        for (const field of ref.fields ?? []) {
          refOr.push({ [field]: { $regex: keyword, $options: "i" } });
        }
        for (const path of ref.dotFields ?? []) {
          refOr.push({ [path]: { $regex: keyword, $options: "i" } });
        }
        if (refOr.length === 0) continue;

        const refQuery: FilterQuery<unknown> = {
          ...(ref.refFilter ?? {}),
          $or: refOr,
        };
        const ids = await ref.model.find(refQuery).distinct("_id");
        if (ids.length > 0) {
          orConditions.push({
            [ref.foreignField]: { $in: ids },
          } as FilterQuery<T>);
        }
      }

      if (orConditions.length === 0) {
        andConditions.push({ _id: { $in: [] } } as FilterQuery<T>);
      } else {
        andConditions.push({ $or: orConditions });
      }
    }

    this.modelQuery = this.modelQuery.find({ $and: andConditions });
    return this;
  }

  filter() {
    if (this.softDeleteEnabled) {
      this.modelQuery = this.modelQuery.find(
        buildSoftDeleteFilter(this.query) as FilterQuery<T>
      );
    }

    const copyQuery = { ...this?.query };
    QUERY_META_KEYS.forEach((el) => delete copyQuery[el]);

    // Comma-separated filter values become `$in` sets (e.g. status=Paid,Draft
    // or customer_id=a,b,c → multi-select UI filters map straight through).
    for (const key of Object.keys(copyQuery)) {
      copyQuery[key] = expandMultiValue(copyQuery[key]);
    }

    const createdAtRange = parseCreatedAtRange(this.query);
    if (createdAtRange) {
      (copyQuery as Record<string, unknown>).createdAt = createdAtRange;
    }

    // Document-date range (the doc's own `date` field), independent of createdAt.
    const docDate = parseDocDateRange(this.query);
    if (docDate) {
      (copyQuery as Record<string, unknown>)[docDate.field] = docDate.range;
    }

    this.modelQuery = this?.modelQuery?.find(copyQuery as FilterQuery<T>);
    return this;
  }

  sort() {
    const sort =
      (this?.query?.sort as string)?.split(",")?.join(" ") || "-createdAt";
    // Always break ties on _id. Without it, documents sharing the sort value
    // (or all tying because the field is absent) come back in a non-deterministic
    // order, so skip/limit windows overlap — the same doc appears on two pages
    // while another never appears at all.
    const keys = sort.split(/\s+/).filter(Boolean);
    const hasId = keys.some((k) => k === "_id" || k === "-_id");
    this.modelQuery = this.modelQuery.sort(hasId ? sort : `${sort} _id`);
    return this;
  }
  fields() {
    const fields =
      (this?.query?.fields as string)?.split(",")?.join(" ") || "-__v";
    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }
  async paginate(_model?: unknown): Promise<{ totalData: number }> {
    void _model;
    const totalData = await this.modelQuery.clone().countDocuments();
    const page = Number(this?.query?.page) || 1;
    const limit = Number(this?.query?.limit) || 10;
    const skip = (page - 1) * limit;
    this.modelQuery = this?.modelQuery?.skip(skip).limit(limit);
    return { totalData };
  }
  calculatePagination({
    totalData,
    currentPage,
    limit,
  }: {
    totalData: number;
    currentPage: number ;
    limit: number;
  }): {
    totalPage: number;
    currentPage: number;
    prevPage: number 
    nextPage: number 
    totalData: number;
  } {
    const totalPage = Math.ceil(totalData / limit) || 1;
    const prevPage = currentPage - 1 > 0 ? currentPage - 1 : 1;
    const nextPage = currentPage + 1 <= totalPage ? currentPage + 1 : 1;
    return {
      totalPage,
      currentPage,
      prevPage,
      nextPage,
      totalData,
    };
  }
}

export default queryBuilder;