import httpStatus from "http-status";
import { Response } from "express";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { contactService } from "./contact.service";

const ok = (res: Response, message: string, data: unknown) =>
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message, data });

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const result = await contactService.list(req, req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Contact submissions retrieved successfully.",
    data: result.data,
    pagination: result.pagination,
  });
});

const getSingle = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Contact submission retrieved successfully.", await contactService.single(req, req.params.id)));

const remove = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Contact submission deleted successfully.", await contactService.remove(req, req.params.id)));

export const contactController = { getAll, getSingle, remove };
