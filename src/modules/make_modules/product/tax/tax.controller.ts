import httpStatus from "http-status";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { taxService } from "./tax.service";
import { ActivityAction } from "../../activities/activities.interface";
import { activitiesService } from "../../activities/activities.service";
import { ActivityModule } from "../../../../utils/activityModules";
import { activityActors } from "../../../../utils/activityContext";

const createTax = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req.user?._id;
  const result = await taxService.createTaxDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tax created successfully.",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.tax,
    entity_ids: [result._id!],
    action: ActivityAction.created,
    title: `Tax ${result.name} Created`,
  });
});

const getAllTax = catchAsync(async (req: AuthRequest, res) => {
  const result = await taxService.getAllTaxDB(req?.user?._id as string, req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Taxes retrieved successfully.",
    data: result,
  });
});

const getSingleTax = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const result = await taxService.getSingleTaxDB(id, req?.user?._id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tax retrieved successfully.",
    data: result,
  });
});

const updateTax = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const result = await taxService.updateTaxDB(id, req.body, req?.user?._id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tax updated successfully.",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.tax,
    entity_ids: [result?._id ?? id],
    action: ActivityAction.updated,
    title: `Tax ${result?.name ?? id} Updated`,
  });
});

const deleteTax = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const result = await taxService.deleteTaxDB(id, req?.user?._id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tax deleted successfully.",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.tax,
    entity_ids: [result?._id ?? id],
    action: ActivityAction.archived,
    title: `Tax ${result?.name ?? id} Deleted`,
  });
});

export const taxController = {
  createTax,
  getAllTax,
  getSingleTax,
  updateTax,
  deleteTax,
};
