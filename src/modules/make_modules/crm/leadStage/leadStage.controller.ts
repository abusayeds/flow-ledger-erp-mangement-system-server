import httpStatus from "http-status";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { leadStageService } from "./leadStage.service";

const createLeadStage = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req.user?._id;
  const result = await leadStageService.createDB(req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Lead stage created successfully.", data: result });
});

const getAllLeadStage = catchAsync(async (req: AuthRequest, res) => {
  const result = await leadStageService.getAllDB(req?.user?._id as string, req.query.pipeline_id as string | undefined);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Lead stages retrieved successfully.", data: result });
});

const getSingleLeadStage = catchAsync(async (req: AuthRequest, res) => {
  const result = await leadStageService.getSingleDB(req.params.id, req?.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Lead stage retrieved successfully.", data: result });
});

const updateLeadStage = catchAsync(async (req: AuthRequest, res) => {
  const result = await leadStageService.updateDB(req.params.id, req.body, req?.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Lead stage updated successfully.", data: result });
});

const deleteLeadStage = catchAsync(async (req: AuthRequest, res) => {
  const result = await leadStageService.deleteDB(req.params.id, req?.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Lead stage deleted successfully.", data: result });
});

const updateOrder = catchAsync(async (req: AuthRequest, res) => {
  const result = await leadStageService.updateOrderDB(req?.user?._id as string, req.body.items);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Lead stage order updated successfully.", data: result });
});

export const leadStageController = { createLeadStage, getAllLeadStage, getSingleLeadStage, updateLeadStage, deleteLeadStage, updateOrder };
