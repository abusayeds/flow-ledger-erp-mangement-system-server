import httpStatus from "http-status";
import { Types } from "mongoose";
import { Response } from "express";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { AuthRequest } from "../../../../middlewares/auth";
import { ticketService } from "./ticket.service";

const ok = (res: Response, message: string, data: unknown) =>
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message, data });

const create = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Ticket created successfully.", await ticketService.createDB(req, req.body)));

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const result = await ticketService.getAllDB(req, req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tickets retrieved successfully.",
    data: result.data,
    pagination: result.pagination,
  });
});

const getRequestData = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Request data retrieved successfully.", await ticketService.getRequestDataDB(req)));

const getSingle = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Ticket retrieved successfully.", await ticketService.getSingleDB(req, req.params.id)));

const update = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Ticket updated successfully.", await ticketService.updateDB(req, req.params.id, req.body)));

const remove = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Ticket deleted successfully.", await ticketService.deleteDB(req, req.params.id)));

const changeStatus = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Ticket status updated successfully.", await ticketService.changeStatusDB(req, req.params.id, req.body.status)));

const storeNote = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Ticket note saved successfully.", await ticketService.storeNoteDB(req, req.params.id, req.body.note)));

const addReply = catchAsync(async (req: AuthRequest, res) => {
  const reply = {
    sender: req.body.sender || "admin",
    description: req.body.description,
    attachments: req.body.attachments || [],
    creator_id: req.user?._id as Types.ObjectId,
  };
  ok(res, "Reply added successfully.", await ticketService.addReplyDB(req, req.params.id, reply));
});

const updateReply = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Reply updated successfully.", await ticketService.updateReplyDB(req, req.params.id, req.params.replyId, req.body)));

const deleteReply = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Reply deleted successfully.", await ticketService.deleteReplyDB(req, req.params.id, req.params.replyId)));

const deleteAttachment = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Attachment deleted successfully.", await ticketService.deleteAttachmentDB(req, req.params.id, req.body.path)));

export const ticketController = {
  create,
  getAll,
  getRequestData,
  getSingle,
  update,
  remove,
  changeStatus,
  storeNote,
  addReply,
  updateReply,
  deleteReply,
  deleteAttachment,
};
