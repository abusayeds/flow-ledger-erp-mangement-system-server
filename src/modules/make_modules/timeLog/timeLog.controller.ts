import httpStatus from "http-status";
import { AuthRequest } from "../../../middlewares/auth";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { timeLogService } from "./timeLog.service";

const create = catchAsync(async (req: AuthRequest, res) => {
  const result = await timeLogService.createDB(req, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Time log created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const result = await timeLogService.getAllDB(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Time logs retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: AuthRequest, res) => {
  const result = await timeLogService.updateDB(req, req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Time log updated successfully",
    data: result,
  });
});

const remove = catchAsync(async (req: AuthRequest, res) => {
  const result = await timeLogService.deleteDB(req, req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Time log deleted successfully",
    data: result,
  });
});

export const timeLogController = { create, getAll, update, remove };
