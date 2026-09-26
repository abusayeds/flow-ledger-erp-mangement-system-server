import httpStatus from "http-status";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { dealStageService } from "./dealStage.service";

const createDealStage = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req.user?._id;
  const result = await dealStageService.createDB(req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Deal stage created successfully.", data: result });
});

const getAllDealStage = catchAsync(async (req: AuthRequest, res) => {
  const result = await dealStageService.getAllDB(req?.user?._id as string, req.query.pipeline_id as string | undefined);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Deal stages retrieved successfully.", data: result });
});

const getSingleDealStage = catchAsync(async (req: AuthRequest, res) => {
  const result = await dealStageService.getSingleDB(req.params.id, req?.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Deal stage retrieved successfully.", data: result });
});

const updateDealStage = catchAsync(async (req: AuthRequest, res) => {
  const result = await dealStageService.updateDB(req.params.id, req.body, req?.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Deal stage updated successfully.", data: result });
});

const deleteDealStage = catchAsync(async (req: AuthRequest, res) => {
  const result = await dealStageService.deleteDB(req.params.id, req?.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Deal stage deleted successfully.", data: result });
});

const updateOrder = catchAsync(async (req: AuthRequest, res) => {
  const result = await dealStageService.updateOrderDB(req?.user?._id as string, req.body.items);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Deal stage order updated successfully.", data: result });
});

export const dealStageController = { createDealStage, getAllDealStage, getSingleDealStage, updateDealStage, deleteDealStage, updateOrder };
