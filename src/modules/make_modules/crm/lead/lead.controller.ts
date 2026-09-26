import httpStatus from "http-status";
import { Response } from "express";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { leadService } from "./lead.service";

const ok = (res: Response, message: string, data: unknown) =>
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message, data });

const uid = (req: AuthRequest) => req?.user?._id as string;

const createLead = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req.user?._id;
  req.body.creator_id = req.user?._id;
  ok(res, "Lead created successfully.", await leadService.createDB(req.body));
});

const getAllLead = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Leads retrieved successfully.", await leadService.getAllDB(uid(req), req.query)));

const getSingleLead = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Lead retrieved successfully.", await leadService.getSingleDB(req.params.id, uid(req))));

const updateLead = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Lead updated successfully.", await leadService.updateDB(req.params.id, req.body, uid(req))));

const deleteLead = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Lead deleted successfully.", await leadService.deleteDB(req.params.id, uid(req))));

const order = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Leads reordered successfully.", await leadService.orderDB(uid(req), req.body.items)));

const updateLabels = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Lead labels updated successfully.", await leadService.setLabelsDB(req.params.id, uid(req), req.body.labels)));

const assignUser = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "User assigned successfully.", await leadService.addUserDB(req.params.id, uid(req), req.body.user_id)));
const removeUser = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "User removed successfully.", await leadService.removeUserDB(req.params.id, uid(req), req.params.userId)));

const assignProduct = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Product assigned successfully.", await leadService.addProductDB(req.params.id, uid(req), req.body.product_id)));
const removeProduct = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Product removed successfully.", await leadService.removeProductDB(req.params.id, uid(req), req.params.productId)));

const assignSource = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Source assigned successfully.", await leadService.addSourceDB(req.params.id, uid(req), req.body.source_id)));
const removeSource = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Source removed successfully.", await leadService.removeSourceDB(req.params.id, uid(req), req.params.sourceId)));

const addTask = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Task added successfully.", await leadService.addTaskDB(req.params.id, uid(req), req.body)));
const updateTask = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Task updated successfully.", await leadService.updateTaskDB(req.params.id, uid(req), req.params.subId, req.body)));
const removeTask = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Task removed successfully.", await leadService.removeTaskDB(req.params.id, uid(req), req.params.subId)));

const addCall = catchAsync(async (req: AuthRequest, res) => {
  if (!req.body.user_id) req.body.user_id = req.user?._id;
  ok(res, "Call added successfully.", await leadService.addCallDB(req.params.id, uid(req), req.body));
});
const updateCall = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Call updated successfully.", await leadService.updateCallDB(req.params.id, uid(req), req.params.subId, req.body)));
const removeCall = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Call removed successfully.", await leadService.removeCallDB(req.params.id, uid(req), req.params.subId)));

const addEmail = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Email added successfully.", await leadService.addEmailDB(req.params.id, uid(req), req.body)));
const removeEmail = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Email removed successfully.", await leadService.removeEmailDB(req.params.id, uid(req), req.params.subId)));

const addDiscussion = catchAsync(async (req: AuthRequest, res) => {
  if (!req.body.created_by) req.body.created_by = req.user?._id;
  ok(res, "Discussion added successfully.", await leadService.addDiscussionDB(req.params.id, uid(req), req.body));
});
const removeDiscussion = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Discussion removed successfully.", await leadService.removeDiscussionDB(req.params.id, uid(req), req.params.subId)));

const addFile = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "File added successfully.", await leadService.addFileDB(req.params.id, uid(req), req.body)));
const removeFile = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "File removed successfully.", await leadService.removeFileDB(req.params.id, uid(req), req.params.subId)));

const convertToDeal = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Lead converted to deal successfully.", await leadService.convertToDealDB(req.params.id, uid(req), req.body)));

export const leadController = {
  createLead, getAllLead, getSingleLead, updateLead, deleteLead, order, updateLabels,
  assignUser, removeUser, assignProduct, removeProduct, assignSource, removeSource,
  addTask, updateTask, removeTask, addCall, updateCall, removeCall,
  addEmail, removeEmail, addDiscussion, removeDiscussion, addFile, removeFile,
  convertToDeal,
};
