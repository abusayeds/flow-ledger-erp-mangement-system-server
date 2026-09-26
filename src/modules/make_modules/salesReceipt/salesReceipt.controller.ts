import httpStatus from 'http-status';
import { AuthRequest } from '../../../middlewares/auth';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import { salesReceiptService } from './salesReceipt.service';
import { ActivityAction } from '../activities/activities.interface';
import { activitiesService } from '../activities/activities.service';
import { TSalesReceipt } from './salesReceipt.interface';
import { ActivityModule } from '../../../utils/activityModules';
import { activityActors } from '../../../utils/activityContext';

const create = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req?.user?._id;
  const result: TSalesReceipt = await salesReceiptService.createDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'SalesReceipt created successfully.',
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.sales_receipt,
    entity_ids: [result._id!],
    action: ActivityAction.created,
    title: `Sales Receipt ${result.invoice_number ?? result._id} Created`,
  });
});

const getSingle = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await salesReceiptService.getSingleDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'SalesReceipt retrieved successfully.',
    data: result,
  });
});

const getAll = catchAsync(async (req: AuthRequest, res) => {

  const result = await salesReceiptService.getAllDB(req.query, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'SalesReceipts retrieved all successfully.',
    data: result.allRecords,
    pagination: result.pagination,
  });
});

const update = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  req.body.user_id = req?.user?._id;
  const result = await salesReceiptService.updateDB(id, req.user?._id as string, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'SalesReceipt updated successfully.',
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.sales_receipt,
    entity_ids: [result?._id ?? id],
    action: ActivityAction.updated,
    title: `Sales Receipt ${result?.invoice_number ?? id} Updated`,
  });
});

const remove = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  await salesReceiptService.deleteDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'SalesReceipt deleted successfully.',
    data: null,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.sales_receipt,
    entity_ids: [id],
    action: ActivityAction.archived,
    title: `Sales Receipt ${id} Deleted`,
  });
});

/** Permanent delete from the Trash tab — actually removes the row. */
const hardRemove = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  await salesReceiptService.hardDeleteDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'SalesReceipt permanently deleted.',
    data: null,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.sales_receipt,
    entity_ids: [id],
    action: ActivityAction.archived,
    title: `Sales Receipt ${id} permanently deleted`,
  });
});

/** Brings a soft-deleted receipt back — the counterpart of `remove`. */
const restore = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const data = await salesReceiptService.restoreDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'SalesReceipt restored successfully.',
    data,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.sales_receipt,
    entity_ids: [id],
    action: ActivityAction.updated,
    title: `Sales Receipt ${id} Restored`,
  });
});

export const salesReceiptController = {
  create,
  getSingle,
  getAll,
  update,
  remove,
  hardRemove,
  restore,
};
