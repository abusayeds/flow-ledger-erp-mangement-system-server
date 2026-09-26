import httpStatus from "http-status";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { pipelineService } from "./pipeline.service";

const createPipeline = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req.user?._id;
  const result = await pipelineService.createDB(req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Pipeline created successfully.", data: result });
});

const getAllPipeline = catchAsync(async (req: AuthRequest, res) => {
  const result = await pipelineService.getAllDB(req?.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Pipelines retrieved successfully.", data: result });
});

const getSinglePipeline = catchAsync(async (req: AuthRequest, res) => {
  const result = await pipelineService.getSingleDB(req.params.id, req?.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Pipeline retrieved successfully.", data: result });
});

const updatePipeline = catchAsync(async (req: AuthRequest, res) => {
  const result = await pipelineService.updateDB(req.params.id, req.body, req?.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Pipeline updated successfully.", data: result });
});

const deletePipeline = catchAsync(async (req: AuthRequest, res) => {
  const result = await pipelineService.deleteDB(req.params.id, req?.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Pipeline deleted successfully.", data: result });
});

export const pipelineController = { createPipeline, getAllPipeline, getSinglePipeline, updatePipeline, deletePipeline };
