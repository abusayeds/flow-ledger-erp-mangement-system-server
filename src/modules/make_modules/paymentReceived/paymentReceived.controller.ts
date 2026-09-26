import httpStatus from 'http-status';
import { AuthRequest } from '../../../middlewares/auth';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import { paymentReceivedService } from './paymentReceived.service';
import { ActivityAction } from '../activities/activities.interface';
import { activitiesService } from '../activities/activities.service';
import { TPaymentReceived } from './paymentReceived.interface';
import { ActivityModule } from '../../../utils/activityModules';
import { activityActors } from '../../../utils/activityContext';

const create = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req?.user?._id;
  const result: TPaymentReceived = await paymentReceivedService.createDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'PaymentReceived created successfully.',
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.payment_received,
    entity_ids: [result._id!],
    action: ActivityAction.created,
    title: `Payment Received ${result.invoice_number ?? result._id} Created`,
  });
});

const getSingle = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await paymentReceivedService.getSingleDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'PaymentReceived retrieved successfully.',
    data: result,
  });
});

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const result = await paymentReceivedService.getAllDB(req.query, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'PaymentReceiveds retrieved all successfully.',
    data: result.allRecords,
    pagination: result.pagination,
  });
});

const update = catchAsync(async (req: AuthRequest, res) => {
  const data = await paymentReceivedService.updateDB(
    req.params.id,
    req.user?._id as string,
    req.body
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'PaymentReceived updated successfully.',
    data,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.payment_received,
    entity_ids: [data?._id ?? req.params.id],
    action: ActivityAction.updated,
    title: `Payment Received ${data?.invoice_number ?? req.params.id} Updated`,
  });
});

const remove = catchAsync(async (req: AuthRequest, res) => {
  const data = await paymentReceivedService.deleteDB(
    req.params.id,
    req.user?._id as string
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'PaymentReceived deleted successfully.',
    data,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.payment_received,
    entity_ids: [req.params.id],
    action: ActivityAction.archived,
    title: `Payment Received ${req.params.id} Deleted`,
  });
});

const restore = catchAsync(async (req: AuthRequest, res) => {
  const data = await paymentReceivedService.restoreDB(
    req.params.id,
    req.user?._id as string
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'PaymentReceived restored successfully.',
    data,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.payment_received,
    entity_ids: [req.params.id],
    action: ActivityAction.updated,
    title: `Payment Received ${req.params.id} Restored`,
  });
});

const hardRemove = catchAsync(async (req: AuthRequest, res) => {
  await paymentReceivedService.hardDeleteDB(
    req.params.id,
    req.user?._id as string
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'PaymentReceived permanently deleted.',
    data: null,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.payment_received,
    entity_ids: [req.params.id],
    action: ActivityAction.deleted,
    title: `Payment Received ${req.params.id} Permanently Deleted`,
  });
});

export const paymentReceivedController = {
  create,
  getSingle,
  getAll,
  update,
  remove,
  restore,
  hardRemove,
};
