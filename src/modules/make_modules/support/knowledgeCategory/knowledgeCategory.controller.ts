import httpStatus from "http-status";
import { Response } from "express";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { knowledgeCategoryService } from "./knowledgeCategory.service";
import { importCsvRows } from "../shared/support.import";

const ok = (res: Response, message: string, data: unknown) =>
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message, data });

const create = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Knowledge category created successfully.", await knowledgeCategoryService.create(req, req.body)));

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const result = await knowledgeCategoryService.list(req, req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Knowledge categories retrieved successfully.",
    data: result.data,
    pagination: result.pagination,
  });
});

const getSingle = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Knowledge category retrieved successfully.", await knowledgeCategoryService.single(req, req.params.id)));

const update = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Knowledge category updated successfully.", await knowledgeCategoryService.update(req, req.params.id, req.body)));

const remove = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Knowledge category deleted successfully.", await knowledgeCategoryService.remove(req, req.params.id)));

const importData = catchAsync(async (req: AuthRequest, res) => {
  const result = importCsvRows(req.body?.csv as string);
  if (!result.ok || !result.rows) {
    return sendResponse(res, { success: false, statusCode: httpStatus.BAD_REQUEST, message: result.error || "Invalid CSV", data: null });
  }
  let imported = 0;
  for (const row of result.rows) {
    if (row.title) {
      await knowledgeCategoryService.create(req, { title: row.title });
      imported++;
    }
  }
  ok(res, `Knowledge categories imported successfully. ${imported} items imported.`, { imported });
});

export const knowledgeCategoryController = { create, getAll, getSingle, update, remove, importData };
