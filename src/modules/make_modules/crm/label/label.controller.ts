import httpStatus from "http-status";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { labelService } from "./label.service";

const createLabel = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req.user?._id;
  const result = await labelService.createDB(req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Label created successfully.", data: result });
});

const getAllLabel = catchAsync(async (req: AuthRequest, res) => {
  const result = await labelService.getAllDB(req?.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Labels retrieved successfully.", data: result });
});

const getSingleLabel = catchAsync(async (req: AuthRequest, res) => {
  const result = await labelService.getSingleDB(req.params.id, req?.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Label retrieved successfully.", data: result });
});

const updateLabel = catchAsync(async (req: AuthRequest, res) => {
  const result = await labelService.updateDB(req.params.id, req.body, req?.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Label updated successfully.", data: result });
});

const deleteLabel = catchAsync(async (req: AuthRequest, res) => {
  const result = await labelService.deleteDB(req.params.id, req?.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Label deleted successfully.", data: result });
});

export const labelController = { createLabel, getAllLabel, getSingleLabel, updateLabel, deleteLabel };
