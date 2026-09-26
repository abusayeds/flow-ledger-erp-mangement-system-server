import httpStatus from 'http-status';
import { AuthRequest } from '../../../middlewares/auth';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import { debitNoteService } from './debitNote.service';
import { ActivityAction } from '../activities/activities.interface';
import { activitiesService } from '../activities/activities.service';
import { TDebitNote } from './debitNote.interface';
import { ActivityModule } from '../../../utils/activityModules';
import { activityActors } from '../../../utils/activityContext';

const create = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req?.user?._id;
  const result: TDebitNote = await debitNoteService.createDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'DebitNote created successfully.',
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.debit_note,
    entity_ids: [result._id!],
    action: ActivityAction.created,
    title: `Debit Note ${result.invoice_number ?? result._id} Created`,
  });
});

const getSingle = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await debitNoteService.getSingleDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'DebitNote retrieved successfully.',
    data: result,
  });
});

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const result = await debitNoteService.getAllDB(req.query, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'DebitNotes retrieved all successfully.',
    data: result.allRecords,
    pagination: result.pagination,
  });
});

const updateSignature = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await debitNoteService.updateSignatureDB(
    id,
    req.user?._id as string,
    req.body?.signature,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'DebitNote signature saved successfully.',
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.debit_note,
    entity_ids: [result._id!],
    action: ActivityAction.updated,
    title: `Debit Note ${result.invoice_number ?? result._id} signature updated`,
  });
});

export const debitNoteController = { create, getSingle, getAll, updateSignature };
