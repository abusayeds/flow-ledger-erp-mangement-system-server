import httpStatus from 'http-status';
import { AuthRequest } from '../../../middlewares/auth';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import { estimateService } from './estimate.service';
import { ActivityAction } from '../activities/activities.interface';
import { activitiesService } from '../activities/activities.service';
import { TEstimate } from './estimate.interface';
import { ActivityModule } from '../../../utils/activityModules';
import { activityActors } from '../../../utils/activityContext';

const create = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req?.user?._id;
  const result: TEstimate = await estimateService.createDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Estimate created successfully.',
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.estimate,
    entity_ids: [result._id!],
    action: ActivityAction.created,
    title: `Estimate ${result.invoice_number ?? result._id} Created`,
  });
});

const getSingle = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await estimateService.getSingleDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Estimate retrieved successfully.',
    data: result,
  });
});

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const result = await estimateService.getAllDB(req.query, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Estimates retrieved all successfully.',
    data: result.allRecords,
    pagination: result.pagination,
  });
});

const update = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  req.body.user_id = req?.user?._id;
  const result = await estimateService.updateDB(id, req.user?._id as string, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Estimate updated successfully.',
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.estimate,
    entity_ids: [result?._id ?? id],
    action: ActivityAction.updated,
    title: `Estimate ${result?.invoice_number ?? id} Updated`,
  });
});

const remove = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  await estimateService.deleteDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Estimate deleted successfully.',
    data: null,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.estimate,
    entity_ids: [id],
    action: ActivityAction.archived,
    title: `Estimate ${id} Deleted`,
  });
});

const hardRemove = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  await estimateService.hardDeleteDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Estimate permanently deleted.',
    data: null,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.estimate,
    entity_ids: [id],
    action: ActivityAction.deleted,
    title: `Estimate ${id} Permanently Deleted`,
  });
});

/** Brings a soft-deleted estimate back — the counterpart of `remove`. */
const restore = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const data = await estimateService.restoreDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Estimate restored successfully.',
    data,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.estimate,
    entity_ids: [id],
    action: ActivityAction.updated,
    title: `Estimate ${id} Restored`,
  });
});

export const estimateController = { create, getSingle, getAll, update, remove, hardRemove, restore };
