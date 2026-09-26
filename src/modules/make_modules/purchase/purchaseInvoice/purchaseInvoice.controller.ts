import httpStatus from "http-status";
import { AuthRequest } from "../../../../middlewares/auth";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { purchaseInvoiceService } from "./purchaseInvoice.service";
import { generatePurchaseInvoicePDF } from "./purchaseInvoice.pdf";
import { PDFSettingModel } from "../../pdf.setting/pdf.setting.model";
import { pdfTypes } from "../../pdf.setting/pdf.setting.interface";

const create = catchAsync(async (req: AuthRequest, res) => {
  const result = await purchaseInvoiceService.createDB(req.user?._id as string, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Purchase invoice created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const result = await purchaseInvoiceService.getAllDB(
    req.user?._id as string,
    req.query as Record<string, unknown>
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Purchase invoices retrieved successfully",
    data: result.data,
    pagination: result.pagination,
  });
});

const getSingle = catchAsync(async (req: AuthRequest, res) => {
  const result = await purchaseInvoiceService.getSingleDB(req.user?._id as string, req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Purchase invoice retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: AuthRequest, res) => {
  const result = await purchaseInvoiceService.updateDB(req.user?._id as string, req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Purchase invoice updated successfully",
    data: result,
  });
});

const remove = catchAsync(async (req: AuthRequest, res) => {
  await purchaseInvoiceService.removeDB(req.user?._id as string, req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Purchase invoice deleted successfully",
    data: null,
  });
});

/** Brings a soft-deleted purchase invoice back — the counterpart of `remove`. */
const restore = catchAsync(async (req: AuthRequest, res) => {
  const result = await purchaseInvoiceService.restoreDB(req.user?._id as string, req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Purchase invoice restored successfully",
    data: result,
  });
});

const post = catchAsync(async (req: AuthRequest, res) => {
  const result = await purchaseInvoiceService.postDB(req.user?._id as string, req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Purchase invoice posted successfully",
    data: result,
  });
});

const updateStatus = catchAsync(async (req: AuthRequest, res) => {
  const result = await purchaseInvoiceService.updateStatusDB(
    req.user?._id as string,
    req.params.id,
    (req.body?.status ?? "") as string,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Purchase invoice status updated successfully",
    data: result,
  });
});

const print = catchAsync(async (req: AuthRequest, res) => {
  const invoice = await purchaseInvoiceService.getSingleDB(req.user?._id as string, req.params.id);
  const settings = await PDFSettingModel.findOne({
    pdfType: pdfTypes.Purchase_Order,
    user_id: req.user?._id,
  }).lean();
  generatePurchaseInvoicePDF(invoice, settings, res);
});

export const purchaseInvoiceController = { create, getAll, getSingle, update, updateStatus, remove, restore, post, print };
