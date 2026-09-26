import httpStatus from 'http-status';
import { AuthRequest } from '../../../middlewares/auth';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import { proformaInvoiceService } from './proformaInvoice.service';
import { ActivityAction } from '../activities/activities.interface';
import { activitiesService } from '../activities/activities.service';
import { TProformaInvoice } from './proformaInvoice.interface';
import { ActivityModule } from '../../../utils/activityModules';
import { activityActors } from '../../../utils/activityContext';

const create = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req?.user?._id;
  const result: TProformaInvoice = await proformaInvoiceService.createDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'ProformaInvoice created successfully.',
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.proforma_invoice,
    entity_ids: [result._id!],
    action: ActivityAction.created,
    title: `Proforma Invoice ${result.invoice_number ?? result._id} Created`,
  });
});

const getSingle = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await proformaInvoiceService.getSingleDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'ProformaInvoice retrieved successfully.',
    data: result,
  });
});

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const result = await proformaInvoiceService.getAllDB(req.query, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'ProformaInvoices retrieved all successfully.',
    data: result.allRecords,
    pagination: result.pagination,
  });
});

const update = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  req.body.user_id = req?.user?._id;
  const result = await proformaInvoiceService.updateDB(id, req.user?._id as string, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'ProformaInvoice updated successfully.',
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.proforma_invoice,
    entity_ids: [result?._id ?? id],
    action: ActivityAction.updated,
    title: `Proforma Invoice ${result?.invoice_number ?? id} Updated`,
  });
});

const duplicate = catchAsync(async (req: AuthRequest, res) => {
  // Ids come from the URL param (single or comma-separated) or the body (`ids` array/string or `id`).
  const rawBodyIds = req.body?.ids ?? req.body?.id;
  const bodyIds = Array.isArray(rawBodyIds) ? rawBodyIds.join(",") : rawBodyIds;
  // Tolerate quotes/brackets/spaces, e.g. duplicate/"id1", "id2"
  const id = String(req.params.id ?? bodyIds ?? "").replace(/["'[\]\s]/g, "");
  const result = await proformaInvoiceService.duplicateDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'ProformaInvoice duplicated successfully.',
    data: result,
  });
  const records = Array.isArray(result) ? result : [result];
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.proforma_invoice,
    entity_ids: records.map((r) => r._id!),
    action: ActivityAction.created,
    title:
      records.length === 1
        ? `Proforma Invoice ${records[0].invoice_number ?? records[0]._id} Duplicated`
        : `${records.length} Proforma Invoices Duplicated`,
  });
});

const remove = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  await proformaInvoiceService.deleteDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'ProformaInvoice deleted successfully.',
    data: null,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.proforma_invoice,
    entity_ids: [id],
    action: ActivityAction.archived,
    title: `Proforma Invoice ${id} Deleted`,
  });
});

const hardRemove = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  await proformaInvoiceService.hardDeleteDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'ProformaInvoice permanently deleted.',
    data: null,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.proforma_invoice,
    entity_ids: [id],
    action: ActivityAction.deleted,
    title: `Proforma Invoice ${id} Permanently Deleted`,
  });
});

/** Brings a soft-deleted proforma back — the counterpart of `remove`. */
const restore = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const data = await proformaInvoiceService.restoreDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'ProformaInvoice restored successfully.',
    data,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.proforma_invoice,
    entity_ids: [id],
    action: ActivityAction.updated,
    title: `Proforma Invoice ${id} Restored`,
  });
});

export const proformaInvoiceController = { create, getSingle, getAll, update, remove, hardRemove, duplicate, restore };
