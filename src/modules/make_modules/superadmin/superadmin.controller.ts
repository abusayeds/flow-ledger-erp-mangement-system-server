import httpStatus from "http-status";
import { AuthRequest } from "../../../middlewares/auth";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { superadminService } from "./superadmin.service";

const overview = catchAsync(async (_req: AuthRequest, res) => {
  const data = await superadminService.overview();
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Platform overview retrieved", data });
});

const companies = catchAsync(async (req: AuthRequest, res) => {
  const data = await superadminService.companies(req.query as Record<string, unknown>);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Companies retrieved", data });
});

const companyDetail = catchAsync(async (req: AuthRequest, res) => {
  const data = await superadminService.companyDetail(req.params.id);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Company detail retrieved", data });
});

const users = catchAsync(async (req: AuthRequest, res) => {
  const data = await superadminService.users(req.query as Record<string, unknown>);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Users retrieved", data });
});

const subscriptions = catchAsync(async (req: AuthRequest, res) => {
  const data = await superadminService.subscriptions(req.query as Record<string, unknown>);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Subscriptions retrieved", data });
});

const assignSubscription = catchAsync(async (req: AuthRequest, res) => {
  const data = await superadminService.assignSubscription(req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Subscription assigned", data });
});

const updateSubscription = catchAsync(async (req: AuthRequest, res) => {
  const data = await superadminService.updateSubscription(req.params.id, req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Subscription updated", data });
});

const impersonate = catchAsync(async (req: AuthRequest, res) => {
  const data = await superadminService.impersonate(req.params.id, req.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Impersonation token issued", data });
});

const payments = catchAsync(async (req: AuthRequest, res) => {
  const data = await superadminService.payments(req.query as Record<string, unknown>);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Payments retrieved", data });
});

const refundPayment = catchAsync(async (req: AuthRequest, res) => {
  const data = await superadminService.refundPayment(req.params.id, req.body, req.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Refund processed", data });
});

const listAdmins = catchAsync(async (req: AuthRequest, res) => {
  const data = await superadminService.listAdmins(req.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Super admins retrieved", data });
});

const createAdmin = catchAsync(async (req: AuthRequest, res) => {
  const data = await superadminService.createAdmin(req.body, req.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.CREATED, message: "Super admin created", data });
});

const removeAdmin = catchAsync(async (req: AuthRequest, res) => {
  const data = await superadminService.removeAdmin(req.params.id, req.user?._id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Super admin removed", data });
});

export const superadminController = {
  overview,
  companies,
  companyDetail,
  users,
  subscriptions,
  assignSubscription,
  updateSubscription,
  impersonate,
  payments,
  refundPayment,
  listAdmins,
  createAdmin,
  removeAdmin,
};
