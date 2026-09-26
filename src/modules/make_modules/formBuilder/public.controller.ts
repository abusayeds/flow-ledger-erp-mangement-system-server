import httpStatus from "http-status";
import { Request } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { publicFormService } from "./public.service";

// Public — no auth. Anyone with the form's code can view & submit.
const showForm = catchAsync(async (req: Request, res) => {
  const result = await publicFormService.showDB(req.params.code);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Form retrieved successfully.", data: result });
});

const submitForm = catchAsync(async (req: Request, res) => {
  const result = await publicFormService.submitDB(req.params.code, req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: result.message, data: result });
});

export const publicFormController = { showForm, submitForm };
