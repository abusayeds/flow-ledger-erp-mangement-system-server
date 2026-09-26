import httpStatus from 'http-status';
import { AuthRequest } from '../../../middlewares/auth';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import { billService } from './bill.service';
import { ActivityAction } from '../activities/activities.interface';
import { activitiesService } from '../activities/activities.service';
import { TBill } from './bill.interface';
import { ActivityModule } from '../../../utils/activityModules';
import { activityActors } from '../../../utils/activityContext';

const create = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req?.user?._id;
  const result: TBill = await billService.createDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Bill created successfully.',
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.bill,
    entity_ids: [result._id!],
    action: ActivityAction.created,
    title: `Bill ${result.invoice_number ?? result._id} Created`,
  });
});

const getSingle = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await billService.getSingleDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Bill retrieved successfully.',
    data: result,
  });
});

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const result = await billService.getAllDB(req.query, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Bills retrieved all successfully.',
    data: result.allRecords,
    pagination: result.pagination,
  });
});

const update = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  req.body.user_id = req?.user?._id;
  const result = await billService.updateDB(id, req.user?._id as string, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Bill updated successfully.',
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.bill,
    entity_ids: [result?._id ?? id],
    action: ActivityAction.updated,
    title: `Bill ${result?.invoice_number ?? id} Updated`,
  });
});

const remove = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  await billService.deleteDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Bill deleted successfully.',
    data: null,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.bill,
    entity_ids: [id],
    action: ActivityAction.archived,
    title: `Bill ${id} Deleted`,
  });
});

/** Brings a soft-deleted bill back — the counterpart of `remove`. */
const restore = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const data = await billService.restoreDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Bill restored successfully.',
    data,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.bill,
    entity_ids: [id],
    action: ActivityAction.updated,
    title: `Bill ${id} Restored`,
  });
});

export const billController = { create, getSingle, getAll, update, remove, restore };
