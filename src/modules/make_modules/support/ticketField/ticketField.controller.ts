import httpStatus from "http-status";
import { Response } from "express";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { ticketFieldService } from "./ticketField.service";

const ok = (res: Response, message: string, data: unknown) =>
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message, data });

const create = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Ticket field created successfully.", await ticketFieldService.create(req, req.body)));

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const result = await ticketFieldService.list(req, req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Ticket fields retrieved successfully.",
    data: result.data,
    pagination: result.pagination,
  });
});

const getSingle = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Ticket field retrieved successfully.", await ticketFieldService.single(req, req.params.id)));

const update = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Ticket field updated successfully.", await ticketFieldService.update(req, req.params.id, req.body)));

const remove = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Ticket field deleted successfully.", await ticketFieldService.remove(req, req.params.id)));

export const ticketFieldController = { create, getAll, getSingle, update, remove };
