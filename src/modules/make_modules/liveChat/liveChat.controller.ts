import httpStatus from "http-status";
import { Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { AuthRequest } from "../../../middlewares/auth";
import { liveChatService } from "./liveChat.service";

const ok = (res: Response, message: string, data: unknown) =>
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message, data });

/* ── App user (my own conversation) ────────────────────────────── */

const getMyThread = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Conversation retrieved successfully.", await liveChatService.getMyThread(req))
);

const sendMyMessage = catchAsync(async (req: AuthRequest, res) =>
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Message sent.",
    data: await liveChatService.sendUserMessage(req, req.body?.text),
  })
);

const markMyRead = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Marked as read.", await liveChatService.markUserRead(req))
);

/* ── Super-admin dashboard ─────────────────────────────────────── */

const listConversations = catchAsync(async (req: AuthRequest, res) => {
  const result = await liveChatService.listConversations(req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Conversations retrieved successfully.",
    data: result.data,
    pagination: result.pagination,
  });
});

const getConversationMessages = catchAsync(async (req: AuthRequest, res) =>
  ok(
    res,
    "Conversation messages retrieved successfully.",
    await liveChatService.getConversationMessages(req.params.id)
  )
);

const sendAdminMessage = catchAsync(async (req: AuthRequest, res) =>
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Reply sent.",
    data: await liveChatService.sendAdminMessage(req, req.params.id, req.body?.text),
  })
);

const markAdminRead = catchAsync(async (req: AuthRequest, res) =>
  ok(res, "Marked as read.", await liveChatService.markAdminRead(req.params.id))
);

export const liveChatController = {
  getMyThread,
  sendMyMessage,
  markMyRead,
  listConversations,
  getConversationMessages,
  sendAdminMessage,
  markAdminRead,
};
