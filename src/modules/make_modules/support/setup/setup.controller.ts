import httpStatus from "http-status";
import { Response } from "express";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { resolveCompanyId } from "../shared/support.utils";
import { setupService } from "./setup.service";

const ok = (res: Response, message: string, data: unknown) =>
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message, data });

const getBrand = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Brand settings retrieved successfully.", await setupService.getBrandDB(resolveCompanyId(req))));

const updateBrand = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Brand settings saved successfully.", await setupService.updateBrandDB(resolveCompanyId(req), req.body)));

const getTitleSections = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Title sections retrieved successfully.", await setupService.getSectionDB(resolveCompanyId(req), setupService.keys.titleSections)));

const saveTitleSections = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Title sections saved successfully.", await setupService.saveSectionDB(resolveCompanyId(req), setupService.keys.titleSections, req.body)));

const getCtaSections = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "CTA sections retrieved successfully.", await setupService.getSectionDB(resolveCompanyId(req), setupService.keys.ctaSections)));

const saveCtaSections = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "CTA sections saved successfully.", await setupService.saveSectionDB(resolveCompanyId(req), setupService.keys.ctaSections, req.body)));

const getSupportInformation = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Support information retrieved successfully.", await setupService.getSectionDB(resolveCompanyId(req), setupService.keys.supportInformation)));

const saveSupportInformation = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Support information saved successfully.", await setupService.saveSectionDB(resolveCompanyId(req), setupService.keys.supportInformation, req.body)));

const getContactInformation = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Contact information retrieved successfully.", await setupService.getSectionDB(resolveCompanyId(req), setupService.keys.contactInformation)));

const saveContactInformation = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Contact information saved successfully.", await setupService.saveSectionDB(resolveCompanyId(req), setupService.keys.contactInformation, req.body)));

export const setupController = {
  getBrand,
  updateBrand,
  getTitleSections,
  saveTitleSections,
  getCtaSections,
  saveCtaSections,
  getSupportInformation,
  saveSupportInformation,
  getContactInformation,
  saveContactInformation,
};
