import httpStatus from "http-status";
import { Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { AuthRequest } from "../../../middlewares/auth";
import { formService } from "./form.service";

const ok = (res: Response, message: string, data: unknown) =>
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message, data });

const uid = (req: AuthRequest) => req?.user?._id as string;

const createForm = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req.user?._id;
  req.body.creator_id = req.user?._id;
  ok(res, "Form created successfully.", await formService.createDB(req.body));
});

const getAllForm = catchAsync(async (req: AuthRequest, res) => {
  const result = await formService.getAllDB(uid(req), req.query as Record<string, unknown>);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Forms retrieved successfully.",
    data: result.data,
    pagination: result.pagination,
  });
});

const getSingleForm = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Form retrieved successfully.", await formService.getSingleDB(req.params.id, uid(req))));

const updateForm = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Form updated successfully.", await formService.updateDB(req.params.id, req.body, uid(req))));

const deleteForm = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Form deleted successfully.", await formService.deleteDB(req.params.id, uid(req))));

const updateFields = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Form fields updated successfully.", await formService.updateFieldsDB(req.params.id, uid(req), req.body.fields)));

const deleteField = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Form field deleted successfully.", await formService.deleteFieldDB(req.params.id, uid(req), req.params.fieldId)));

const getResponses = catchAsync(async (req: AuthRequest, res) => {
  const result = await formService.responsesDB(req.params.id, uid(req), req.query as Record<string, unknown>);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Form responses retrieved successfully.",
    data: result.data,
    pagination: result.pagination,
  });
});

const getSingleResponse = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Form response retrieved successfully.", await formService.singleResponseDB(req.params.id, req.params.responseId, uid(req))));

const deleteResponse = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Form response deleted successfully.", await formService.deleteResponseDB(req.params.id, req.params.responseId, uid(req))));

const getConversion = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Form conversion retrieved successfully.", await formService.getConversionDB(req.params.id, uid(req))));

const updateConversion = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Form conversion saved successfully.", await formService.updateConversionDB(req.params.id, uid(req), req.body)));

const conversionModules = catchAsync(async (_req: AuthRequest, res) =>
  ok(res, "Available conversion modules retrieved successfully.", formService.getAvailableModules()));

export const formController = {
  createForm, getAllForm, getSingleForm, updateForm, deleteForm, updateFields, deleteField,
  getResponses, getSingleResponse, deleteResponse, getConversion, updateConversion, conversionModules,
};
