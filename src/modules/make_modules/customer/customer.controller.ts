import httpStatus from "http-status";
import { AuthRequest } from "../../../middlewares/auth";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { customerService } from "./customer.service";
import { activitiesService } from "../activities/activities.service";
import { ActivityAction } from "../activities/activities.interface";
import { Types } from "mongoose";
import { ActivityModule } from "../../../utils/activityModules";
import { activityActors } from "../../../utils/activityContext";
import { handleParamBulkDelete } from "../../../utils/bulkDeleteController";

const customerCreate = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req?.user?._id;
  const result = await customerService.customerCreateDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Customer successfully.",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.customer,
    entity_ids: [result._id as Types.ObjectId],
    action: ActivityAction.created,
    title: `${result?.businessProfile?.companyName || result?.name} Customer Created`,
  });
});

const allCustomer = catchAsync(async (req: AuthRequest, res) => {
  const result = await customerService.allCustomerDB(
    req?.user?._id as string,
    req.query,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All customer get successfully.",
    pagination: result.pagination,
    data: result.allCustomer,
  });
});

// Full-document list (web `/customers` alias). Same envelope as allCustomer.
const allCustomerFull = catchAsync(async (req: AuthRequest, res) => {
  const result = await customerService.allCustomerFullDB(
    req?.user?._id as string,
    req.query,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All customer get successfully.",
    pagination: result.pagination,
    data: result.allCustomer,
  });
});

const invoiceCustomerList = catchAsync(async (req: AuthRequest, res) => {
  const result = await customerService.invoiceCustomerList(
    req?.user?._id as string,
    req.query,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All customer get successfully.",
    pagination: result.pagination,
    data: result.allCustomer,
  });
});

const singleCustomer = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await customerService.singleCustomerDB(
    req?.user?._id as string,
    id,
    req.query as Record<string, unknown>,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Single customer get successfully.",
    data: result,
  });
});

const deleteCustomer = catchAsync(async (req: AuthRequest, res) => {
  const { ids, data: result } = await handleParamBulkDelete(req.params.id, (id) =>
    customerService.deleteCustomerDB(req?.user?._id as string, {
      _id: new Types.ObjectId(id),
    }),
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Oparation successfull.",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.customer,
    entity_ids: ids.map((id) => new Types.ObjectId(id)),
    action: ActivityAction.archived,
    title:
      ids.length === 1
        ? `${result?.businessProfile?.companyName || result?.name || "Customer"} Archived`
        : `${ids.length} Customers Archived`,
  });
});

/** Permanent delete from Trash (supports comma-separated ids). Mobile soft-delete route untouched. */
const hardDeleteCustomer = catchAsync(async (req: AuthRequest, res) => {
  const { ids, data: result } = await handleParamBulkDelete(req.params.id, (id) =>
    customerService.hardDeleteCustomerDB(req?.user?._id as string, id),
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Customer permanently deleted.",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.customer,
    entity_ids: ids.map((id) => new Types.ObjectId(id)),
    action: ActivityAction.archived,
    title:
      ids.length === 1
        ? `${result?.businessProfile?.companyName || result?.name || "Customer"} permanently deleted`
        : `${ids.length} Customers permanently deleted`,
  });
});

const restoreCustomer = catchAsync(async (req: AuthRequest, res) => {
  const result = await customerService.restoreCustomerDB(
    req?.user?._id as string,
    req.params.id,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Customer restored successfully.",
    data: result,
  });
});

const updateCustomer = catchAsync(async (req: AuthRequest, res) => {
  const result = await customerService.updateCustomerDB(
    req?.user?._id as string,
    req.body,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Oparation successfull.",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.customer,
    entity_ids: [result._id as Types.ObjectId],
    action: ActivityAction.updated,
    title: `${result?.businessProfile?.companyName || result?.name} Customer Updated`,
  });
});

const mergeCustomers = catchAsync(async (req: AuthRequest, res) => {
  const result = await customerService.mergeCustomersDB(
    req?.user?._id as unknown as string,
    req.body.survivor_id,
    req.body.merged_ids,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Customers merged successfully.",
    data: result,
  });
});

export const customerController = {
  mergeCustomers,
  customerCreate,
  allCustomer,
  allCustomerFull,
  invoiceCustomerList,
  singleCustomer,
  deleteCustomer,
  hardDeleteCustomer,
  restoreCustomer,
  updateCustomer,
};
