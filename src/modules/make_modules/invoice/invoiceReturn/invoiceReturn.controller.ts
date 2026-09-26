import httpStatus from "http-status";
import { AuthRequest } from "../../../../middlewares/auth";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { invoiceReturnService } from "./invoiceReturn.service";
import { activitiesService } from "../../activities/activities.service";
import { ActivityAction } from "../../activities/activities.interface";
import { ActivityModule } from "../../../../utils/activityModules";
import { activityActors } from "../../../../utils/activityContext";

const createReturn = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req?.user?._id;
  const result = await invoiceReturnService.createInvoiceReturnDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Invoice Return created successfully",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.invoice_return,
    entity_ids: [result._id!],
    action: ActivityAction.created,
    title: "Invoice Return Created",
  });
});

const getAllReturn = catchAsync(async (req: AuthRequest, res) => {
  const result = await invoiceReturnService.getAllInvoiceReturnDB(
    req.query,
    req?.user?._id as string
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice Returns retrieved successfully",
    data: result.allReturns,
    pagination: result.pagination,
  });
});

const getSingleReturn = catchAsync(async (req: AuthRequest, res) => {
  const result = await invoiceReturnService.getSingleInvoiceReturnDB(
    req.params.id,
    req?.user?._id as string
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice Return retrieved successfully",
    data: result,
  });
});

const updateReturn = catchAsync(async (req: AuthRequest, res) => {
  const result = await invoiceReturnService.updateInvoiceReturnDB(
    req.params.id,
    req?.user?._id as string,
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice Return updated successfully",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.invoice_return,
    entity_ids: [result?._id ?? req.params.id],
    action: ActivityAction.updated,
    title: "Invoice Return Updated",
  });
});

const deleteReturn = catchAsync(async (req: AuthRequest, res) => {
  await invoiceReturnService.deleteInvoiceReturnDB(
    req.params.id,
    req?.user?._id as string
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice Return deleted successfully",
    data: null,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.invoice_return,
    entity_ids: [req.params.id],
    action: ActivityAction.archived,
    title: "Invoice Return Deleted",
  });
});

const approveReturn = catchAsync(async (req: AuthRequest, res) => {
  const result = await invoiceReturnService.approveInvoiceReturnDB(
    req.params.id,
    req?.user?._id as string
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice return approved; draft credit note created",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.invoice_return,
    entity_ids: [result.salesReturn._id],
    action: ActivityAction.updated,
    title: "Invoice Return Approved",
  });
});

/** Brings a soft-deleted invoice return back — the counterpart of `deleteReturn`. */
const restoreReturn = catchAsync(async (req: AuthRequest, res) => {
  const result = await invoiceReturnService.restoreInvoiceReturnDB(
    req.params.id,
    req?.user?._id as string
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice Return restored successfully",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.invoice_return,
    entity_ids: [req.params.id],
    action: ActivityAction.updated,
    title: "Invoice Return Restored",
  });
});

export const invoiceReturnController = {
  createReturn,
  getAllReturn,
  getSingleReturn,
  updateReturn,
  deleteReturn,
  approveReturn,
  restoreReturn,
};
