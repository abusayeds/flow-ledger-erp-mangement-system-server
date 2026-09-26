import httpStatus from "http-status";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { taxGroupService } from "./taxGroup.service";
import { ActivityAction } from "../../activities/activities.interface";
import { activitiesService } from "../../activities/activities.service";
import { ActivityModule } from "../../../../utils/activityModules";
import { activityActors } from "../../../../utils/activityContext";

const createTaxGroup = catchAsync(async (req: AuthRequest, res) => {
  const result = await taxGroupService.createTaxGroupDB(
    req.body,
    req.user?._id as string
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tax group created successfully.",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.tax,
    entity_ids: [result._id!],
    action: ActivityAction.created,
    title: `Tax group ${result.name} Created`,
  });
});

const getAllTaxGroup = catchAsync(async (req: AuthRequest, res) => {
  const result = await taxGroupService.getAllTaxGroupDB(
    req?.user?._id as string,
    req.query
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tax groups retrieved successfully.",
    data: result,
  });
});

const getSingleTaxGroup = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await taxGroupService.getSingleTaxGroupDB(
    id,
    req?.user?._id as string
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tax group retrieved successfully.",
    data: result,
  });
});

const updateTaxGroup = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await taxGroupService.updateTaxGroupDB(
    id,
    req.body,
    req?.user?._id as string
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tax group updated successfully.",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.tax,
    entity_ids: [result?._id ?? id],
    action: ActivityAction.updated,
    title: `Tax group ${result?.name ?? id} Updated`,
  });
});

const deleteTaxGroup = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await taxGroupService.deleteTaxGroupDB(
    id,
    req?.user?._id as string
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tax group deleted successfully.",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.tax,
    entity_ids: [result?._id ?? id],
    action: ActivityAction.archived,
    title: `Tax group ${result?.name ?? id} Deleted`,
  });
});

export const taxGroupController = {
  createTaxGroup,
  getAllTaxGroup,
  getSingleTaxGroup,
  updateTaxGroup,
  deleteTaxGroup,
};
