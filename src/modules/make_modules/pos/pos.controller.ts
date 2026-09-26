import httpStatus from "http-status";
import { AuthRequest } from "../../../middlewares/auth";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { posService } from "./pos.service";
import { posOrderService } from "./order/posOrder.service";

const getDashboard = catchAsync(async (req: AuthRequest, res) => {
  const result = await posService.getDashboard(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "POS dashboard retrieved successfully",
    data: result,
  });
});

const createOrder = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req.user!._id;
  const data = await posOrderService.createDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "POS order created successfully",
    data,
  });
});

const getOrders = catchAsync(async (req: AuthRequest, res) => {
  const result = await posOrderService.getAllDB(req.user!._id as string, req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "POS orders retrieved successfully",
    data: result.allRecords,
    pagination: result.pagination,
  });
});

const getOrder = catchAsync(async (req: AuthRequest, res) => {
  const data = await posOrderService.getSingleDB(req.params.id, req.user!._id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "POS order retrieved successfully",
    data,
  });
});

const removeOrder = catchAsync(async (req: AuthRequest, res) => {
  const data = await posOrderService.deleteDB(req.params.id, req.user!._id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "POS order deleted successfully",
    data,
  });
});

export const posController = { getDashboard, createOrder, getOrders, getOrder, removeOrder };
