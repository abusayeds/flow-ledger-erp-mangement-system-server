import httpStatus from 'http-status';
import { AuthRequest } from '../../../middlewares/auth';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import { creditNoteService } from './creditNote.service';
import { ActivityAction } from '../activities/activities.interface';
import { activitiesService } from '../activities/activities.service';
import { TCreditNote } from './creditNote.interface';
import { ActivityModule } from '../../../utils/activityModules';
import { activityActors } from '../../../utils/activityContext';

const create = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req?.user?._id;
  const result: TCreditNote = await creditNoteService.createDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'CreditNote created successfully.',
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.credit_note,
    entity_ids: [result._id!],
    action: ActivityAction.created,
    title: `Credit Note ${result.invoice_number ?? result._id} Created`,
  });
});

const getSingle = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await creditNoteService.getSingleDB(id, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'CreditNote retrieved successfully.',
    data: result,
  });
});

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const result = await creditNoteService.getAllDB(req.query, req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'CreditNotes retrieved all successfully.',
    data: result.allRecords,
    pagination: result.pagination,
  });
});

export const creditNoteController = { create, getSingle, getAll };
