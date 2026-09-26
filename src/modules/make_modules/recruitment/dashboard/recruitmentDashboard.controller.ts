import httpStatus from "http-status";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { recruitmentDashboardService } from "./recruitmentDashboard.service";

const getDashboard = catchAsync(async (req: AuthRequest, res) => {
  const data = await recruitmentDashboardService.getDashboard(req);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Recruitment dashboard retrieved successfully",
    data,
  });
});

export const recruitmentDashboardController = { getDashboard };
