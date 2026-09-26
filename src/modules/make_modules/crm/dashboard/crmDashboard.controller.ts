import httpStatus from "http-status";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { crmDashboardService } from "./crmDashboard.service";

const getDashboard = catchAsync(async (req: AuthRequest, res) => {
  const data = await crmDashboardService.getDashboard(req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "CRM dashboard retrieved successfully",
    data,
  });
});

export const crmDashboardController = { getDashboard };
