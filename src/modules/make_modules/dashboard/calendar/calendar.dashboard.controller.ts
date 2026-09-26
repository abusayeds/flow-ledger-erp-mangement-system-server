import httpStatus from "http-status";
import { AuthRequest } from "../../../../middlewares/auth";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { calendarDashboardService } from "./calendar.dashboard.service";

const getEventCalendar = catchAsync(async (req: AuthRequest, res) => {
  const result = await calendarDashboardService.getEventCalendar(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Calendar events retrieved successfully",
    data: result,
  });
});

export const calendarDashboardController = { getEventCalendar };
