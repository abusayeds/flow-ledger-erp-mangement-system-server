import httpStatus from "http-status";
import { AuthRequest } from "../../../../middlewares/auth";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { accountDebitNoteService } from "./accountDebitNote.service";
import { ActivityAction } from "../../activities/activities.interface";
import { activitiesService } from "../../activities/activities.service";
import { TDebitNote } from "../../debitNote/debitNote.interface";
import { ActivityModule } from "../../../../utils/activityModules";
import { activityActors } from "../../../../utils/activityContext";

const create = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req.user!._id;
  const data: TDebitNote = await accountDebitNoteService.createDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Debit note created successfully",
    data,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.account_debit_note,
    entity_ids: [data._id!],
    action: ActivityAction.created,
    title: `Account Debit Note ${data.invoice_number ?? data._id} Created`,
  });
});

const update = catchAsync(async (req: AuthRequest, res) => {
  const data = await accountDebitNoteService.updateDB(
    req.params.id,
    req.user!._id as string,
    req.body,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Debit note updated successfully",
    data,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.account_debit_note,
    entity_ids: [data._id!],
    action: ActivityAction.updated,
    title: `Account Debit Note ${data.invoice_number ?? data._id} Updated`,
  });
});

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const result = await accountDebitNoteService.getAllDB(req.user!._id as string, req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Debit notes retrieved successfully",
    data: result.rows,
    pagination: result.pagination,
  });
});

const getSingle = catchAsync(async (req: AuthRequest, res) => {
  const data = await accountDebitNoteService.getSingleDB(req.params.id, req.user!._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Debit note retrieved successfully",
    data,
  });
});

const approve = catchAsync(async (req: AuthRequest, res) => {
  const data = await accountDebitNoteService.approveDB(req.params.id, req.user!._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Debit note approved successfully",
    data,
  });
});

const remove = catchAsync(async (req: AuthRequest, res) => {
  const data = await accountDebitNoteService.deleteDB(req.params.id, req.user!._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Debit note deleted successfully",
    data,
  });
});

const updateSignature = catchAsync(async (req: AuthRequest, res) => {
  const data = await accountDebitNoteService.updateSignatureDB(
    req.params.id,
    req.user!._id as string,
    req.body?.signature,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Debit note signature saved successfully",
    data,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.account_debit_note,
    entity_ids: [data._id!],
    action: ActivityAction.updated,
    title: `Account Debit Note ${data.invoice_number ?? data._id} signature updated`,
  });
});

export const accountDebitNoteController = { create, update, getAll, getSingle, approve, remove, updateSignature };
