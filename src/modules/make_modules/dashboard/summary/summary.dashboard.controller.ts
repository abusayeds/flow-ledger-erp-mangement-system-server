import httpStatus from "http-status";
import { AuthRequest } from "../../../../middlewares/auth";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { summaryDashboardService } from "./summary.dashboard.service";

const getDashboard = catchAsync(async (req: AuthRequest, res) => {
  const result = await summaryDashboardService.getDashboard(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Summary dashboard retrieved successfully",
    data: result,
  });
});

const getContacts = catchAsync(async (req: AuthRequest, res) => {
  const result = await summaryDashboardService.getContacts(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:
      result.role === "customer"
        ? "Customers retrieved successfully"
        : "Vendors retrieved successfully",
    pagination: result.pagination,
    data: {
      role: result.role,
      summary: result.summary,
      records: result.records,
    },
  });
});

export const summaryDashboardController = { getDashboard, getContacts };
