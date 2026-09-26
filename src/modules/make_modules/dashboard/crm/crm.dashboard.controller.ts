import httpStatus from "http-status";
import { AuthRequest } from "../../../../middlewares/auth";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { crmDashboardService } from "./crm.dashboard.service";

const getDashboard = catchAsync(async (req: AuthRequest, res) => {
  const result = await crmDashboardService.getDashboard(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "CRM dashboard retrieved successfully",
    data: result,
  });
});

export const crmDashboardController = { getDashboard };
