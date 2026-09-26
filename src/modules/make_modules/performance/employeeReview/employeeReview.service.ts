import httpStatus from "http-status";
import { FilterQuery, Types } from "mongoose";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { AuthRequest } from "../../../../middlewares/auth";
import { permission } from "../../../../utils/permission";
import { UserModel } from "../../../basic_modules/user/user.model";
import {
  applyReviewOwnership,
  assertEmployeeUser,
  companyObjectId,
  companyScope,
  creatorObjectId,
  refName,
  resolveCompanyId,
  resolveOwnership,
} from "../performance.utils";
import { PerformanceIndicatorModel } from "../indicator/indicator.model";
import { PerformanceReviewCycleModel } from "../reviewCycle/reviewCycle.model";
import { PerformanceEmployeeReviewModel } from "./employeeReview.model";
import {
  TPerformanceEmployeeReview,
  TReviewRatings,
} from "./employeeReview.interface";
import { withBulkDeleteAuthId } from "../../../../utils/bulkDelete";

const P = permission.performance.employee_review;

const POPULATE = [
  { path: "employee_user_id", select: "name" },
  { path: "reviewer_id", select: "name" },
  { path: "review_cycle_id", select: "name" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reviewListItem = (r: any) => ({
  _id: r._id,
  user: refName(r.employee_user_id),
  reviewer: refName(r.reviewer_id),
  review_cycle: refName(r.review_cycle_id),
  review_date: r.review_date,
  status: r.status,
  average_rating: r.average_rating ?? null,
  createdAt: r.createdAt,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reviewDetail = (r: any) => ({
  _id: r._id,
  user: refName(r.employee_user_id),
  reviewer: refName(r.reviewer_id),
  review_cycle: refName(r.review_cycle_id),
  review_date: r.review_date,
  status: r.status,
  pros: r.pros ?? null,
  cons: r.cons ?? null,
  completion_date: r.completion_date ?? null,
});

const ownershipOf = (req: AuthRequest) =>
  resolveOwnership(req, P.manage_any_employee_reviews, P.manage_own_employee_reviews);

/** Load a review inside company scope and enforce row-level ownership. */
const getOwnedReview = async (req: AuthRequest, id: string) => {
  const companyId = resolveCompanyId(req);
  const base = applyReviewOwnership(
    { _id: id, ...companyScope(companyId) } as FilterQuery<TPerformanceEmployeeReview>,
    ownershipOf(req)
  );
  const review = await PerformanceEmployeeReviewModel.findOne(base);
  if (!review) throw new AppError(httpStatus.NOT_FOUND, "Employee review not found");
  return review;
};

/** Active indicators (under active categories) grouped by category name. */
const buildIndicatorGroups = async (
  companyId: string,
  ratings: TReviewRatings = {},
  withUserRating = false
) => {
  const indicators = await PerformanceIndicatorModel.find({
    ...companyScope(companyId),
    status: "active",
  })
    .populate({ path: "category_id", select: "name status" })
    .lean();

  const groups: Record<string, unknown[]> = {};
  for (const indicator of indicators) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const category = indicator.category_id as any;
    if (!category || category.status !== "active") continue;
    const name = category.name ?? "Uncategorized";
    if (!groups[name]) groups[name] = [];
    groups[name].push({
      _id: indicator._id,
      name: indicator.name,
      category: { name: category.name },
      ...(withUserRating
        ? { user_rating: Number(ratings?.[String(indicator._id)] ?? 0) }
        : {}),
    });
  }
  return groups;
};

const averageOf = (ratings: TReviewRatings = {}) => {
  const rated = Object.values(ratings)
    .map((v) => Number(v))
    .filter((v) => !Number.isNaN(v) && v > 0);
  if (rated.length === 0) return null;
  return Math.round((rated.reduce((a, b) => a + b, 0) / rated.length) * 10) / 10;
};

const validateRefs = async (body: Record<string, unknown>, companyId: string) => {
  if (body.employee_user_id !== undefined) {
    await assertEmployeeUser(body.employee_user_id, companyId, "Employee");
  }
  if (body.reviewer_id !== undefined) {
    await assertEmployeeUser(body.reviewer_id, companyId, "Reviewer");
  }
  const cycleId = body.review_cycle_id;
  if (cycleId !== undefined && cycleId !== null && cycleId !== "") {
    if (!Types.ObjectId.isValid(String(cycleId))) {
      throw new AppError(httpStatus.BAD_REQUEST, "Valid review cycle is required");
    }
    const cycle = await PerformanceReviewCycleModel.findOne({
      _id: cycleId,
      ...companyScope(companyId),
    });
    if (!cycle) {
      throw new AppError(httpStatus.BAD_REQUEST, "Review cycle not found in your company");
    }
  }
};

const createDB = async (req: AuthRequest, body: Record<string, unknown>) => {
  const companyId = resolveCompanyId(req);
  await validateRefs(body, companyId);
  const review = await PerformanceEmployeeReviewModel.create({
    employee_user_id: body.employee_user_id,
    reviewer_id: body.reviewer_id,
    review_cycle_id: body.review_cycle_id,
    review_date: body.review_date,
    status: body.status ?? "pending",
    user_id: companyObjectId(companyId),
    creator_id: creatorObjectId(req),
    isDeleted: false,
  });
  await review.populate(POPULATE);
  return reviewDetail(review);
};

const getAllDB = async (req: AuthRequest, query: Record<string, unknown>) => {
  const companyId = resolveCompanyId(req);
  const base = applyReviewOwnership(
    companyScope(companyId) as FilterQuery<TPerformanceEmployeeReview>,
    ownershipOf(req)
  );
  const refFilter = { companyId: companyObjectId(companyId), isDeleted: false };

  const qb = new queryBuilder(PerformanceEmployeeReviewModel.find(base).populate(POPULATE), query);
  await qb.searchNested({
    refs: [
      {
        foreignField: "employee_user_id",
        model: UserModel as never,
        fields: ["name", "email"],
        refFilter,
      },
      {
        foreignField: "reviewer_id",
        model: UserModel as never,
        fields: ["name", "email"],
        refFilter,
      },
    ],
  });
  qb.filter().sort().fields();

  const { totalData } = await qb.paginate(PerformanceEmployeeReviewModel.find(base));
  const rows = await qb.modelQuery.exec();
  const data = rows.map(reviewListItem);
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query?.limit) || 10;
  const pagination = qb.calculatePagination({ totalData, currentPage, limit });
  return { data, pagination };
};

const getSingleDB = async (req: AuthRequest, id: string) => {
  const companyId = resolveCompanyId(req);
  const review = await getOwnedReview(req, id);
  await review.populate(POPULATE);
  const ratings = (review.rating ?? {}) as TReviewRatings;
  const performanceIndicators = await buildIndicatorGroups(companyId, ratings, true);
  return {
    employeeReview: reviewDetail(review),
    performanceIndicators,
    averageRating: averageOf(ratings),
  };
};

const conductGetDB = async (req: AuthRequest, id: string) => {
  const companyId = resolveCompanyId(req);
  const review = await getOwnedReview(req, id);
  await review.populate(POPULATE);
  const existingRatings = (review.rating ?? {}) as TReviewRatings;
  const performanceIndicators = await buildIndicatorGroups(companyId, existingRatings, false);
  return { employeeReview: reviewDetail(review), performanceIndicators, existingRatings };
};

const conductStoreDB = async (req: AuthRequest, id: string, body: Record<string, unknown>) => {
  const review = await getOwnedReview(req, id);
  const companyId = resolveCompanyId(req);

  const rawRatings = body.ratings;
  if (!rawRatings || typeof rawRatings !== "object" || Array.isArray(rawRatings)) {
    throw new AppError(httpStatus.BAD_REQUEST, "ratings is required");
  }
  const incoming: TReviewRatings = {};
  for (const [indicatorId, value] of Object.entries(rawRatings as Record<string, unknown>)) {
    const score = Number(value);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      throw new AppError(httpStatus.BAD_REQUEST, "Each rating must be an integer between 1 and 5");
    }
    incoming[indicatorId] = score;
  }

  // Merge with existing ratings: same indicator id → updated, new id → added, others kept.
  const existing = (review.rating ?? {}) as TReviewRatings;
  const rating: TReviewRatings = { ...existing, ...incoming };

  const update: Record<string, unknown> = {
    rating,
    status: "completed",
    completion_date: new Date(),
  };
  if (typeof body.pros === "string") update.pros = body.pros;
  if (typeof body.cons === "string") update.cons = body.cons;

  const updated = await PerformanceEmployeeReviewModel.findOneAndUpdate(
    { _id: id, ...companyScope(companyId) },
    { $set: update },
    { new: true, runValidators: true }
  ).populate(POPULATE);

  if (!updated) throw new AppError(httpStatus.NOT_FOUND, "Employee review not found");
  return reviewDetail(updated);
};

const updateDB = async (req: AuthRequest, id: string, body: Record<string, unknown>) => {
  await getOwnedReview(req, id);
  const companyId = resolveCompanyId(req);
  await validateRefs(body, companyId);

  const payload: Record<string, unknown> = {};
  for (const key of [
    "employee_user_id",
    "reviewer_id",
    "review_cycle_id",
    "review_date",
    "status",
  ]) {
    if (body[key] !== undefined) payload[key] = body[key];
  }

  const updated = await PerformanceEmployeeReviewModel.findOneAndUpdate(
    { _id: id, ...companyScope(companyId) },
    { $set: payload },
    { new: true, runValidators: true }
  ).populate(POPULATE);
  if (!updated) throw new AppError(httpStatus.NOT_FOUND, "Employee review not found");
  return reviewDetail(updated);
};

const removeDBOne = async (req: AuthRequest, id: string) => {
  await getOwnedReview(req, id);
  const companyId = resolveCompanyId(req);
  await PerformanceEmployeeReviewModel.findOneAndUpdate(
    { _id: id, ...companyScope(companyId) },
    { isDeleted: true }
  );
  return { _id: id };
};

const removeDB = withBulkDeleteAuthId(removeDBOne);

export const employeeReviewService = {
  createDB,
  getAllDB,
  getSingleDB,
  conductGetDB,
  conductStoreDB,
  updateDB,
  removeDB,
};
