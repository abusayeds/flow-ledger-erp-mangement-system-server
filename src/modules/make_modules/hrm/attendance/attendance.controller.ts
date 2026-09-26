import httpStatus from "http-status";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { attendanceService } from "./attendance.service";
import { sendHrmPaginatedList } from "../shared/hrm.response";

const clientIp = (req: AuthRequest) =>
  (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip;

export const attendanceController = {
  list: catchAsync(async (req: AuthRequest, res) => {
    const result = await attendanceService.list(req, req.query as Record<string, unknown>);
    sendHrmPaginatedList(res, "Attendances", result);
  }),
  grid: catchAsync(async (req: AuthRequest, res) => {
    const data = await attendanceService.grid(req, req.query as Record<string, unknown>);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Attendance grid",
      data,
    });
  }),
  create: catchAsync(async (req: AuthRequest, res) => {
    const { action, data } = await attendanceService.createManual(req, req.body);
    sendResponse(res, {
      success: true,
      statusCode: action === "created" ? httpStatus.CREATED : httpStatus.OK,
      message: action === "created" ? "Attendance created" : "Attendance updated",
      data: { action, attendance: data },
    });
  }),
  clockStatus: catchAsync(async (req: AuthRequest, res) => {
    const data = await attendanceService.clockStatus(req);
    sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Clock status", data });
  }),
  clockInOut: catchAsync(async (req: AuthRequest, res) => {
    const { action, data } = await attendanceService.clockInOut(req, clientIp(req));
    const message = action === "clock_out" ? "Clock out successful" : "Clock in successful";
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message,
      data: { action, attendance: data },
    });
  }),
  history: catchAsync(async (req: AuthRequest, res) => {
    const data = await attendanceService.history(req, req.body);
    sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Attendance history", data });
  }),
  update: catchAsync(async (req: AuthRequest, res) => {
    const data = await attendanceService.update(req, req.params.id, req.body);
    sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Attendance updated", data });
  }),
  remove: catchAsync(async (req: AuthRequest, res) => {
    const data = await attendanceService.remove(req, req.params.id);
    sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Attendance deleted", data });
  }),
};
