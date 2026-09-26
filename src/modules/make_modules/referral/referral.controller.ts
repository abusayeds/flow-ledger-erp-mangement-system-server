import httpStatus from "http-status";
import { AuthRequest } from "../../../middlewares/auth";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { referralService } from "./referral.service";

const create = catchAsync(async (req: AuthRequest, res) => {
  const data = await referralService.createDB(req.user?._id as string, req.body?.email);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Referral invitation sent",
    data,
  });
});

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const data = await referralService.getAllDB(req.user?._id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Referrals retrieved successfully",
    data,
  });
});

export const referralController = { create, getAll };
