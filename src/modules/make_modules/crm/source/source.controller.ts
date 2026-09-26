import httpStatus from "http-status";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { sourceService } from "./source.service";

const createSource = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req.user?._id;
  const result = await sourceService.createDB(req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Source created successfully.", data: result });
});

const getAllSource = catchAsync(async (req: AuthRequest, res) => {
  const result = await sourceService.getAllDB(req?.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Sources retrieved successfully.", data: result });
});

const getSingleSource = catchAsync(async (req: AuthRequest, res) => {
  const result = await sourceService.getSingleDB(req.params.id, req?.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Source retrieved successfully.", data: result });
});

const updateSource = catchAsync(async (req: AuthRequest, res) => {
  const result = await sourceService.updateDB(req.params.id, req.body, req?.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Source updated successfully.", data: result });
});

const deleteSource = catchAsync(async (req: AuthRequest, res) => {
  const result = await sourceService.deleteDB(req.params.id, req?.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Source deleted successfully.", data: result });
});

export const sourceController = { createSource, getAllSource, getSingleSource, updateSource, deleteSource };
