import httpStatus from "http-status";
import { AuthRequest } from "../../../../middlewares/auth";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { applyCompanyUserToBody, creatorId } from "../account.utils";
import { vendorPaymentService } from "./vendorPayment.service";

const create = catchAsync(async (req: AuthRequest, res) => {
  applyCompanyUserToBody(req);
  req.body.creator_id = creatorId(req);
  const data = await vendorPaymentService.createDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Vendor payment created successfully",
    data,
  });
});

const record = catchAsync(async (req: AuthRequest, res) => {
  applyCompanyUserToBody(req);
  req.body.creator_id = creatorId(req);
  const data = await vendorPaymentService.recordDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Vendor payment recorded successfully",
    data,
  });
});

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const result = await vendorPaymentService.getAllDB(req.user!._id as string, req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Vendor payments retrieved successfully",
    data: result.rows,
    pagination: result.pagination,
  });
});

const getSingle = catchAsync(async (req: AuthRequest, res) => {
  const data = await vendorPaymentService.getSingleDB(
    req.params.id,
    req.user!._id as string
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Vendor payment retrieved successfully",
    data,
  });
});

const getOutstanding = catchAsync(async (req: AuthRequest, res) => {
  const data = await vendorPaymentService.getOutstandingDB(
    req.user!._id as string,
    req.params.vendorId
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Outstanding bills retrieved successfully",
    data,
  });
});

const updateStatus = catchAsync(async (req: AuthRequest, res) => {
  const data = await vendorPaymentService.updateStatusDB(
    req.params.id,
    req.user!._id as string,
    req.body.status
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Vendor payment status updated successfully",
    data,
  });
});

const remove = catchAsync(async (req: AuthRequest, res) => {
  const data = await vendorPaymentService.deleteDB(req.params.id, req.user!._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Vendor payment deleted successfully",
    data,
  });
});

export const vendorPaymentController = {
  create,
  record,
  getAll,
  getSingle,
  getOutstanding,
  updateStatus,
  remove,
};
