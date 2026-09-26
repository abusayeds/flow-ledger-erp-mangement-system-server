import httpStatus from "http-status";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { supportDashboardService } from "./supportDashboard.service";

const getDashboard = catchAsync(async (req: AuthRequest, res) => {
  const data = await supportDashboardService.getDashboard(req);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Support dashboard retrieved successfully",
    data,
  });
});

export const supportDashboardController = { getDashboard };
