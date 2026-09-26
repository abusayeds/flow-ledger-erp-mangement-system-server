import httpStatus from "http-status";
import { AuthRequest } from "../../../middlewares/auth";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { contractService } from "./contract.service";

const create = catchAsync(async (req: AuthRequest, res) => {
  const data = await contractService.createDB(req.user?._id as string, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Contract created successfully",
    data,
  });
});

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const data = await contractService.getAllDB(
    req.user?._id as string,
    req.query as Record<string, unknown>
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Contracts retrieved successfully",
    data,
  });
});

const getSingle = catchAsync(async (req: AuthRequest, res) => {
  const data = await contractService.getSingleDB(
    req.user?._id as string,
    req.params.id
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Contract retrieved successfully",
    data,
  });
});

const update = catchAsync(async (req: AuthRequest, res) => {
  const data = await contractService.updateDB(
    req.user?._id as string,
    req.params.id,
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Contract updated successfully",
    data,
  });
});

const remove = catchAsync(async (req: AuthRequest, res) => {
  await contractService.deleteDB(req.user?._id as string, req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Contract deleted successfully",
    data: null,
  });
});

export const contractController = { create, getAll, getSingle, update, remove };
