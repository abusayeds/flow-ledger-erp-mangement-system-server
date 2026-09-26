import httpStatus from "http-status";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { crmReportService } from "./report.service";

const leadReports = catchAsync(async (req: AuthRequest, res) => {
  const result = await crmReportService.leadReportsDB(req?.user?._id as string, req.query);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Lead reports retrieved successfully.", data: result });
});

const dealReports = catchAsync(async (req: AuthRequest, res) => {
  const result = await crmReportService.dealReportsDB(req?.user?._id as string, req.query);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Deal reports retrieved successfully.", data: result });
});

export const crmReportController = { leadReports, dealReports };
