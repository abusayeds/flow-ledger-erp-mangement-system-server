import httpStatus from "http-status";
import { Response } from "express";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { dealService } from "./deal.service";

const ok = (res: Response, message: string, data: unknown) =>
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message, data });

const uid = (req: AuthRequest) => req?.user?._id as string;

const createDeal = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req.user?._id;
  req.body.creator_id = req.user?._id;
  ok(res, "Deal created successfully.", await dealService.createDB(req.body));
});

const getAllDeal = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Deals retrieved successfully.", await dealService.getAllDB(uid(req), req.query)));

const getSingleDeal = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Deal retrieved successfully.", await dealService.getSingleDB(req.params.id, uid(req))));

const updateDeal = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Deal updated successfully.", await dealService.updateDB(req.params.id, req.body, uid(req))));

const deleteDeal = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Deal deleted successfully.", await dealService.deleteDB(req.params.id, uid(req))));

const order = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Deals reordered successfully.", await dealService.orderDB(uid(req), req.body.items)));

const changeStatus = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Deal status updated successfully.", await dealService.changeStatusDB(req.params.id, uid(req), req.body.status)));

const updateLabels = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Deal labels updated successfully.", await dealService.setLabelsDB(req.params.id, uid(req), req.body.labels)));

const assignUser = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "User assigned successfully.", await dealService.addUserDB(req.params.id, uid(req), req.body.user_id)));
const removeUser = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "User removed successfully.", await dealService.removeUserDB(req.params.id, uid(req), req.params.userId)));

const assignProduct = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Product assigned successfully.", await dealService.addProductDB(req.params.id, uid(req), req.body.product_id)));
const removeProduct = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Product removed successfully.", await dealService.removeProductDB(req.params.id, uid(req), req.params.productId)));

const assignSource = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Source assigned successfully.", await dealService.addSourceDB(req.params.id, uid(req), req.body.source_id)));
const removeSource = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Source removed successfully.", await dealService.removeSourceDB(req.params.id, uid(req), req.params.sourceId)));

const assignClient = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Client assigned successfully.", await dealService.addClientDB(req.params.id, uid(req), req.body.client_id)));
const removeClient = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Client removed successfully.", await dealService.removeClientDB(req.params.id, uid(req), req.params.clientId)));

const addTask = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Task added successfully.", await dealService.addTaskDB(req.params.id, uid(req), req.body)));
const updateTask = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Task updated successfully.", await dealService.updateTaskDB(req.params.id, uid(req), req.params.subId, req.body)));
const removeTask = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Task removed successfully.", await dealService.removeTaskDB(req.params.id, uid(req), req.params.subId)));

const addCall = catchAsync(async (req: AuthRequest, res) => {
  if (!req.body.user_id) req.body.user_id = req.user?._id;
  ok(res, "Call added successfully.", await dealService.addCallDB(req.params.id, uid(req), req.body));
});
const updateCall = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Call updated successfully.", await dealService.updateCallDB(req.params.id, uid(req), req.params.subId, req.body)));
const removeCall = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Call removed successfully.", await dealService.removeCallDB(req.params.id, uid(req), req.params.subId)));

const addEmail = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Email added successfully.", await dealService.addEmailDB(req.params.id, uid(req), req.body)));
const removeEmail = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Email removed successfully.", await dealService.removeEmailDB(req.params.id, uid(req), req.params.subId)));

const addDiscussion = catchAsync(async (req: AuthRequest, res) => {
  if (!req.body.created_by) req.body.created_by = req.user?._id;
  ok(res, "Discussion added successfully.", await dealService.addDiscussionDB(req.params.id, uid(req), req.body));
});
const removeDiscussion = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Discussion removed successfully.", await dealService.removeDiscussionDB(req.params.id, uid(req), req.params.subId)));

const addFile = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "File added successfully.", await dealService.addFileDB(req.params.id, uid(req), req.body)));
const removeFile = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "File removed successfully.", await dealService.removeFileDB(req.params.id, uid(req), req.params.subId)));

export const dealController = {
  createDeal, getAllDeal, getSingleDeal, updateDeal, deleteDeal, order, changeStatus, updateLabels,
  assignUser, removeUser, assignProduct, removeProduct, assignSource, removeSource, assignClient, removeClient,
  addTask, updateTask, removeTask, addCall, updateCall, removeCall,
  addEmail, removeEmail, addDiscussion, removeDiscussion, addFile, removeFile,
};
