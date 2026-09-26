import httpStatus from "http-status";
import { AuthRequest } from "../../../middlewares/auth";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { companyRegisterService } from "./companyRegister.service";

const create = catchAsync(async (req: AuthRequest, res) => {
  const data = await companyRegisterService.createDB(req.user?._id as string, req.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Company created successfully", data });
});
const getAll = catchAsync(async (req: AuthRequest, res) => {
  const data = await companyRegisterService.getAllDB(req.user?._id as string, req.query as Record<string, unknown>);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Companies retrieved successfully", data });
});
const getSingle = catchAsync(async (req: AuthRequest, res) => {
  const data = await companyRegisterService.getSingleDB(req.user?._id as string, req.params.id);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Company retrieved successfully", data });
});
const update = catchAsync(async (req: AuthRequest, res) => {
  const data = await companyRegisterService.updateDB(req.user?._id as string, req.params.id, req.body);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Company updated successfully", data });
});
const remove = catchAsync(async (req: AuthRequest, res) => {
  await companyRegisterService.deleteDB(req.user?._id as string, req.params.id);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Company deleted successfully", data: null });
});

export const companyRegisterController = { create, getAll, getSingle, update, remove };
