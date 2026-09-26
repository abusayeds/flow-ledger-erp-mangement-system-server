import httpStatus from "http-status";
import { Response } from "express";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { ticketCategoryService } from "./ticketCategory.service";

const ok = (res: Response, message: string, data: unknown) =>
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message, data });

const create = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Category created successfully.", await ticketCategoryService.create(req, req.body)));

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const result = await ticketCategoryService.list(req, req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Categories retrieved successfully.",
    data: result.data,
    pagination: result.pagination,
  });
});

const getSingle = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Category retrieved successfully.", await ticketCategoryService.single(req, req.params.id)));

const update = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Category updated successfully.", await ticketCategoryService.update(req, req.params.id, req.body)));

const remove = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Category deleted successfully.", await ticketCategoryService.remove(req, req.params.id)));

export const ticketCategoryController = { create, getAll, getSingle, update, remove };
