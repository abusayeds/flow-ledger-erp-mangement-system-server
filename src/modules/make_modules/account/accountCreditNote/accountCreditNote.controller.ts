import httpStatus from "http-status";
import { AuthRequest } from "../../../../middlewares/auth";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { accountCreditNoteService } from "./accountCreditNote.service";
import { ActivityAction } from "../../activities/activities.interface";
import { activitiesService } from "../../activities/activities.service";
import { TCreditNote } from "../../creditNote/creditNote.interface";
import { ActivityModule } from "../../../../utils/activityModules";
import { activityActors } from "../../../../utils/activityContext";

const create = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req.user!._id;
  const data: TCreditNote = await accountCreditNoteService.createDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Credit note created successfully",
    data,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.account_credit_note,
    entity_ids: [data._id!],
    action: ActivityAction.created,
    title: `Account Credit Note ${data.invoice_number ?? data._id} Created`,
  });
});

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const result = await accountCreditNoteService.getAllDB(req.user!._id as string, req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Credit notes retrieved successfully",
    data: result.rows,
    pagination: result.pagination,
  });
});

const getSingle = catchAsync(async (req: AuthRequest, res) => {
  const data = await accountCreditNoteService.getSingleDB(req.params.id, req.user!._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Credit note retrieved successfully",
    data,
  });
});

const approve = catchAsync(async (req: AuthRequest, res) => {
  const data = await accountCreditNoteService.approveDB(req.params.id, req.user!._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Credit note approved successfully",
    data,
  });
});

const remove = catchAsync(async (req: AuthRequest, res) => {
  const data = await accountCreditNoteService.deleteDB(req.params.id, req.user!._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Credit note deleted successfully",
    data,
  });
});

const hardRemove = catchAsync(async (req: AuthRequest, res) => {
  const data = await accountCreditNoteService.hardDeleteDB(req.params.id, req.user!._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Credit note permanently deleted",
    data,
  });
});

const update = catchAsync(async (req: AuthRequest, res) => {
  const data = await accountCreditNoteService.updateDB(
    req.params.id,
    req.user!._id as string,
    req.body
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Credit note updated successfully",
    data,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.account_credit_note,
    entity_ids: [data?._id ?? req.params.id],
    action: ActivityAction.updated,
    title: `Account Credit Note ${data?.invoice_number ?? req.params.id} Updated`,
  });
});

const restore = catchAsync(async (req: AuthRequest, res) => {
  const data = await accountCreditNoteService.restoreDB(
    req.params.id,
    req.user!._id as string
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Credit note restored successfully",
    data,
  });
});

export const accountCreditNoteController = {
  create,
  getAll,
  getSingle,
  approve,
  remove,
  hardRemove,
  update,
  restore,
};
