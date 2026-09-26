import httpStatus from "http-status";
import { Response } from "express";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { customPageService } from "./customPage.service";

const ok = (res: Response, message: string, data: unknown) =>
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message, data });

const create = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Custom page created successfully.", await customPageService.create(req, req.body)));

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const result = await customPageService.list(req, req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Custom pages retrieved successfully.",
    data: result.data,
    pagination: result.pagination,
  });
});

const getSingle = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Custom page retrieved successfully.", await customPageService.single(req, req.params.id)));

const update = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Custom page updated successfully.", await customPageService.update(req, req.params.id, req.body)));

const remove = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Custom page deleted successfully.", await customPageService.remove(req, req.params.id)));

export const customPageController = { create, getAll, getSingle, update, remove };
