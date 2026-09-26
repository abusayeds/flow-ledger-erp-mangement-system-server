import httpStatus from "http-status";
import { AuthRequest } from "../../../../../middlewares/auth";
import catchAsync from "../../../../../utils/catchAsync";
import sendResponse from "../../../../../utils/sendResponse";
import { transferService } from "./transfer.service";
import { activitiesService } from "../../../activities/activities.service";
import { ActivityAction } from "../../../activities/activities.interface";
import { ActivityModule } from "../../../../../utils/activityModules";
import { activityActors } from "../../../../../utils/activityContext";

const createTransfer = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req?.user?._id;
  const result = await transferService.createTransferDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Stock transfer completed successfully",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.warehouse_transfer,
    entity_ids: [result!._id],
    action: ActivityAction.created,
    title: "Warehouse stock transfer",
  });
});

const getAllTransfer = catchAsync(async (req: AuthRequest, res) => {
  const result = await transferService.getAllTransferDB(req.query, req?.user?._id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stock transfers retrieved successfully",
    data: result.allTransfers,
    pagination: result.pagination,
  });
});

const getSingleTransfer = catchAsync(async (req: AuthRequest, res) => {
  const result = await transferService.getSingleTransferDB(req.params.id, req?.user?._id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stock transfer retrieved successfully",
    data: result,
  });
});

const removeTransfer = catchAsync(async (req: AuthRequest, res) => {
  await transferService.deleteTransferDB(req.params.id, req?.user?._id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stock transfer deleted successfully",
    data: null,
  });
});

const restoreTransfer = catchAsync(async (req: AuthRequest, res) => {
  const result = await transferService.restoreTransferDB(
    req.params.id,
    req?.user?._id as string
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stock transfer restored successfully",
    data: result,
  });
});

export const transferController = {
  createTransfer,
  getAllTransfer,
  getSingleTransfer,
  removeTransfer,
  restoreTransfer,
};
