import httpStatus from "http-status";
import { AuthRequest } from "../../../../middlewares/auth";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { supportDashboardService } from "./support.dashboard.service";

const getDashboard = catchAsync(async (req: AuthRequest, res) => {
  const result = await supportDashboardService.getDashboard(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Support dashboard retrieved successfully",
    data: result,
  });
});

export const supportDashboardController = { getDashboard };
