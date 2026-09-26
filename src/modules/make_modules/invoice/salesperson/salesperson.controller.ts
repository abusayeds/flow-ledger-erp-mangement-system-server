import httpStatus from "http-status";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { salespersonService } from "./salesperson.service";

const createSalesperson = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req.user?._id;
  const result = await salespersonService.createDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Salesperson created successfully.",
    data: result,
  });
});

const getAllSalesperson = catchAsync(async (req: AuthRequest, res) => {
  const searchTerm = typeof req.query.searchTerm === "string" ? req.query.searchTerm : "";
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const result = await salespersonService.getAllDB(req?.user?._id as string, {
    searchTerm,
    status,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Salespersons retrieved successfully.",
    data: result,
  });
});

const getSingleSalesperson = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await salespersonService.getSingleDB(id, req?.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Salesperson retrieved successfully.",
    data: result,
  });
});

const updateSalesperson = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await salespersonService.updateDB(id, req.body, req?.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Salesperson updated successfully.",
    data: result,
  });
});

const deleteSalesperson = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await salespersonService.deleteDB(id, req?.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Salesperson deleted successfully.",
    data: result,
  });
});

export const salespersonController = {
  createSalesperson,
  getAllSalesperson,
  getSingleSalesperson,
  updateSalesperson,
  deleteSalesperson,
};
