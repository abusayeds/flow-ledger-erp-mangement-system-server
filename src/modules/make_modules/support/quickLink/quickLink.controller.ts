import httpStatus from "http-status";
import { Response } from "express";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { quickLinkService } from "./quickLink.service";

const ok = (res: Response, message: string, data: unknown) =>
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message, data });

const create = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Quick link created successfully.", await quickLinkService.create(req, req.body)));

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const result = await quickLinkService.list(req, req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Quick links retrieved successfully.",
    data: result.data,
    pagination: result.pagination,
  });
});

const getSingle = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Quick link retrieved successfully.", await quickLinkService.single(req, req.params.id)));

const update = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Quick link updated successfully.", await quickLinkService.update(req, req.params.id, req.body)));

const remove = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Quick link deleted successfully.", await quickLinkService.remove(req, req.params.id)));

export const quickLinkController = { create, getAll, getSingle, update, remove };
