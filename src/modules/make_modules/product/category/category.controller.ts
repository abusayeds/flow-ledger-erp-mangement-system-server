import httpStatus from "http-status";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { categoryService } from "./category.service";
import { ActivityAction } from "../../activities/activities.interface";
import { activitiesService } from "../../activities/activities.service";
import { ActivityModule } from "../../../../utils/activityModules";
import { activityActors } from "../../../../utils/activityContext";

// CREATE
const createCategory = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req.user?._id
  const result = await categoryService.createCategoryDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category created successfully.",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.category,
    entity_ids: [result._id!],
    action: ActivityAction.created,
    title: `Category ${result.category} Created`,
  });
});

// GET ALL
const getAllCategory = catchAsync(async (req: AuthRequest, res) => {
  const typeFilter = (req.query.category || req.query.type) as string | undefined;
  const searchTerm = (req.query.searchTerm || req.query.search) as string | undefined;
  const result = await categoryService.getAllCategoryDB(
    req?.user?._id as string,
    typeFilter,
    searchTerm,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Categories retrieved successfully.",
    data: result,
  });
});

// GET SINGLE
const getSingleCategory = catchAsync(async (req : AuthRequest, res) => {
  const { id } = req.params;

  const result = await categoryService.getSingleCategoryDB(id , req?.user?._id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category retrieved successfully.",
    data: result,
  });
});

// UPDATE
const updateCategory = catchAsync(async (req : AuthRequest, res) => {
  const { id } = req.params;

  const result = await categoryService.updateCategoryDB(id, req.body , req?.user?._id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category updated successfully.",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.category,
    entity_ids: [result?._id ?? id],
    action: ActivityAction.updated,
    title: `Category ${result?.category ?? id} Updated`,
  });
});

// DELETE
const deleteCategory = catchAsync(async (req : AuthRequest, res) => {
  const { id } = req.params;

  const result = await categoryService.deleteCategoryDB(id , req?.user?._id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category deleted successfully.",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.category,
    entity_ids: [result?._id ?? id],
    action: ActivityAction.archived,
    title: `Category ${result?.category ?? id} Deleted`,
  });
});

export const categoryController = {
  createCategory,
  getAllCategory,
  getSingleCategory,
  updateCategory,
  deleteCategory,
};
