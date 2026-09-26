import httpStatus from "http-status";
import { Response } from "express";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { faqService } from "./faq.service";
import { importCsvRows } from "../shared/support.import";

const ok = (res: Response, message: string, data: unknown) =>
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message, data });

const create = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "FAQ created successfully.", await faqService.create(req, req.body)));

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const result = await faqService.list(req, req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "FAQs retrieved successfully.",
    data: result.data,
    pagination: result.pagination,
  });
});

const getSingle = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "FAQ retrieved successfully.", await faqService.single(req, req.params.id)));

const update = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "FAQ updated successfully.", await faqService.update(req, req.params.id, req.body)));

const remove = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "FAQ deleted successfully.", await faqService.remove(req, req.params.id)));

const importPreview = catchAsync(async (req: AuthRequest, res) => {
  const result = importCsvRows(req.body?.csv as string, 10);
  if (!result.ok) {
    return sendResponse(res, { success: false, statusCode: httpStatus.BAD_REQUEST, message: result.error || "Invalid CSV", data: null });
  }
  ok(res, "Import preview generated.", { html: result.html, status: true });
});

const importData = catchAsync(async (req: AuthRequest, res) => {
  const result = importCsvRows(req.body?.csv as string);
  if (!result.ok || !result.rows) {
    return sendResponse(res, { success: false, statusCode: httpStatus.BAD_REQUEST, message: result.error || "Invalid CSV", data: null });
  }
  let imported = 0;
  for (const row of result.rows) {
    if (row.title && row.description) {
      await faqService.create(req, { title: row.title, description: row.description });
      imported++;
    }
  }
  ok(res, `FAQ imported successfully. ${imported} items imported.`, { imported });
});

export const faqController = { create, getAll, getSingle, update, remove, importPreview, importData };
