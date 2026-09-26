import httpStatus from "http-status";
import { Response } from "express";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { supportSettingService } from "./settings.service";

const ok = (res: Response, message: string, data: unknown) =>
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message, data });
const uid = (req: AuthRequest) => req?.user?._id as string;

const getAll = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Support settings retrieved successfully.", await supportSettingService.getAllDB(uid(req))));

const getOne = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Support setting retrieved successfully.", await supportSettingService.getOneDB(uid(req), req.params.key)));

const update = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Support settings saved successfully.", await supportSettingService.updateDB(uid(req), req.body)));

export const supportSettingController = { getAll, getOne, update };
