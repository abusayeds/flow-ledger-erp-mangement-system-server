import httpStatus from 'http-status';
import { AuthRequest } from '../../../middlewares/auth';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import { invoiceService } from './invoice.service';
import { ActivityAction } from '../activities/activities.interface';
import { activitiesService } from '../activities/activities.service';
import { TInvoice } from './invoice.interface';
import { ActivityModule } from '../../../utils/activityModules';
import { activityActors } from '../../../utils/activityContext';

const create = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req?.user?._id;
  const result: TInvoice = await invoiceService.createDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Invoice created successfully.',
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.invoice,
    entity_ids: [result._id!],
    action: ActivityAction.created,
    title: `Invoice ${result.invoice_number ?? result._id} Created`,
  });
});

const getSingle = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await invoiceService.getSingleDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Invoice retrieved successfully.',
    data: result,
  });
});

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const result = await invoiceService.getAllDB(req.query, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Invoices retrieved all successfully.',
    data: result.allRecords,
    pagination: result.pagination,
  });
});

const update = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  req.body.user_id = req?.user?._id;
  const result = await invoiceService.updateDB(id, req.user?._id as string, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Invoice updated successfully.',
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.invoice,
    entity_ids: [result?._id ?? id],
    action: ActivityAction.updated,
    title: `Invoice ${result?.invoice_number ?? id} Updated`,
  });
});

const remove = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  await invoiceService.deleteDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Invoice deleted successfully.',
    data: null,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.invoice,
    entity_ids: [id],
    action: ActivityAction.archived,
    title: `Invoice ${id} Deleted`,
  });
});

/** Brings a soft-deleted invoice back — the counterpart of `remove`. */
const restore = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const data = await invoiceService.restoreDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Invoice restored successfully.',
    data,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.invoice,
    entity_ids: [id],
    action: ActivityAction.updated,
    title: `Invoice ${id} Restored`,
  });
});

const hardRemove = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  await invoiceService.hardDeleteDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Invoice permanently deleted.',
    data: null,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.invoice,
    entity_ids: [id],
    action: ActivityAction.deleted,
    title: `Invoice ${id} Permanently Deleted`,
  });
});

export const invoiceController = { create, getSingle, getAll, update, remove, restore, hardRemove };
