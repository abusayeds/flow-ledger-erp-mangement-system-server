import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../errors/AppError";
import { AuthRequest } from "../../../middlewares/auth";
import { ChatConversationModel, ChatMessageModel } from "./liveChat.model";
import { TChatConversation, TChatMessage } from "./liveChat.interface";
import { emitChatMessage, emitConversationUpdate } from "../../../utils/socket";

/**
 * Scripted introductory auto-replies. The bot answers only the user's first
 * two messages, then stays silent so a human agent takes over the thread.
 */
const BOT_INTRO_SCRIPTS = [
  "Hi! 👋 Thanks for reaching out to Qyad Support. Tell us a bit about what you need help with and an agent will join shortly.",
  "Thanks for the details! 🙌 Our support team has been notified and will reply right here. You'll get a notification as soon as they respond.",
];

const serializeMessage = (m: TChatMessage) => ({
  _id: String(m._id),
  conversation_id: String(m.conversation_id),
  sender: m.sender,
  senderUser_id: m.senderUser_id ? String(m.senderUser_id) : null,
  text: m.text,
  readByAdmin: m.readByAdmin,
  readByUser: m.readByUser,
  createdAt: m.createdAt,
});

const serializeConversation = (c: any) => {
  const u = c.user_id && typeof c.user_id === "object" ? c.user_id : null;
  return {
    _id: String(c._id),
    user_id: u ? String(u._id) : String(c.user_id),
    userName: u?.name ?? null,
    userEmail: u?.email ?? null,
    userPhone: u?.phone ?? null,
    lastMessageText: c.lastMessageText ?? null,
    lastMessageAt: c.lastMessageAt ?? null,
    lastSender: c.lastSender ?? null,
    unreadForAdmin: c.unreadForAdmin ?? 0,
    unreadForUser: c.unreadForUser ?? 0,
    status: c.status ?? "open",
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
};

const getOrCreateConversation = async (userId: Types.ObjectId) => {
  let conv = await ChatConversationModel.findOne({ user_id: userId });
  if (!conv) conv = await ChatConversationModel.create({ user_id: userId });
  return conv;
};

/** App user: fetch (or lazily create) my conversation and its full history. */
const getMyThread = async (req: AuthRequest) => {
  const userId = req.user!._id as Types.ObjectId;
  const conv = await getOrCreateConversation(userId);
  const messages = await ChatMessageModel.find({ conversation_id: conv._id })
    .sort({ createdAt: 1 })
    .lean();
  return {
    conversation: serializeConversation(conv.toObject()),
    messages: messages.map(serializeMessage),
  };
};

/** App user sends a message; may trigger one scripted bot auto-reply. */
const sendUserMessage = async (req: AuthRequest, text: string) => {
  const trimmed = (text ?? "").trim();
  if (!trimmed) throw new AppError(httpStatus.BAD_REQUEST, "Message is empty.");

  const userId = req.user!._id as Types.ObjectId;
  const conv = await getOrCreateConversation(userId);

  const userMsg = await ChatMessageModel.create({
    conversation_id: conv._id,
    sender: "user",
    senderUser_id: userId,
    text: trimmed,
    readByUser: true,
    readByAdmin: false,
  });

  conv.lastMessageText = trimmed;
  conv.lastMessageAt = userMsg.createdAt;
  conv.lastSender = "user";
  conv.unreadForAdmin = (conv.unreadForAdmin ?? 0) + 1;
  conv.status = "open";
  await conv.save();

  const userPayload = serializeMessage(userMsg);
  emitChatMessage(String(userId), userPayload);

  // Scripted intro auto-reply for the first two user messages only.
  let autoReply = null;
  if ((conv.botIntroCount ?? 0) < BOT_INTRO_SCRIPTS.length) {
    const botText = BOT_INTRO_SCRIPTS[conv.botIntroCount ?? 0];
    const botMsg = await ChatMessageModel.create({
      conversation_id: conv._id,
      sender: "bot",
      senderUser_id: null,
      text: botText,
      readByUser: false,
      readByAdmin: true,
    });
    conv.botIntroCount = (conv.botIntroCount ?? 0) + 1;
    conv.lastMessageText = botText;
    conv.lastMessageAt = botMsg.createdAt;
    conv.lastSender = "bot";
    conv.unreadForUser = (conv.unreadForUser ?? 0) + 1;
    await conv.save();

    autoReply = serializeMessage(botMsg);
    emitChatMessage(String(userId), autoReply);
  }

  emitConversationUpdate(serializeConversation(conv.toObject()));
  return { message: userPayload, autoReply };
};

/** App user marks admin/bot messages as read (clears their badge). */
const markUserRead = async (req: AuthRequest) => {
  const userId = req.user!._id as Types.ObjectId;
  const conv = await ChatConversationModel.findOne({ user_id: userId });
  if (!conv) return { updated: 0 };
  await ChatMessageModel.updateMany(
    { conversation_id: conv._id, sender: { $in: ["admin", "bot"] }, readByUser: false },
    { $set: { readByUser: true } }
  );
  conv.unreadForUser = 0;
  await conv.save();
  emitConversationUpdate(serializeConversation(conv.toObject()));
  return { updated: 1 };
};

/* ── Admin (super-admin dashboard) ─────────────────────────────── */

const listConversations = async (query: Record<string, unknown>) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 30));
  const filter: Record<string, unknown> = {};
  if (query.status === "open" || query.status === "closed") {
    filter.status = query.status;
  }

  const [rows, total] = await Promise.all([
    ChatConversationModel.find(filter)
      .populate("user_id", "name email phone")
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ChatConversationModel.countDocuments(filter),
  ]);

  // Client-side search on the denormalized user name/email.
  const q = String(query.search ?? "").trim().toLowerCase();
  let data = rows.map(serializeConversation);
  if (q) {
    data = data.filter(
      (c) =>
        (c.userName ?? "").toLowerCase().includes(q) ||
        (c.userEmail ?? "").toLowerCase().includes(q) ||
        (c.lastMessageText ?? "").toLowerCase().includes(q)
    );
  }

  const totalPage = Math.max(1, Math.ceil(total / limit));
  return {
    data,
    pagination: {
      totalPage,
      currentPage: page,
      prevPage: page > 1 ? page - 1 : 1,
      nextPage: page < totalPage ? page + 1 : totalPage,
      limit,
      totalData: total,
    },
  };
};

const getConversationMessages = async (conversationId: string) => {
  const conv = await ChatConversationModel.findById(conversationId)
    .populate("user_id", "name email phone")
    .lean();
  if (!conv) throw new AppError(httpStatus.NOT_FOUND, "Conversation not found.");
  const messages = await ChatMessageModel.find({ conversation_id: conversationId })
    .sort({ createdAt: 1 })
    .lean();
  return {
    conversation: serializeConversation(conv),
    messages: messages.map(serializeMessage),
  };
};

const sendAdminMessage = async (
  req: AuthRequest,
  conversationId: string,
  text: string
) => {
  const trimmed = (text ?? "").trim();
  if (!trimmed) throw new AppError(httpStatus.BAD_REQUEST, "Message is empty.");

  const conv = await ChatConversationModel.findById(conversationId);
  if (!conv) throw new AppError(httpStatus.NOT_FOUND, "Conversation not found.");

  const adminId = req.user!._id as Types.ObjectId;
  const adminMsg = await ChatMessageModel.create({
    conversation_id: conv._id,
    sender: "admin",
    senderUser_id: adminId,
    text: trimmed,
    readByUser: false,
    readByAdmin: true,
  });

  conv.lastMessageText = trimmed;
  conv.lastMessageAt = adminMsg.createdAt;
  conv.lastSender = "admin";
  conv.unreadForUser = (conv.unreadForUser ?? 0) + 1;
  conv.status = "open";
  await conv.save();

  const payload = serializeMessage(adminMsg);
  emitChatMessage(String(conv.user_id), payload);
  emitConversationUpdate(serializeConversation(conv.toObject()));
  return payload;
};

const markAdminRead = async (conversationId: string) => {
  const conv = await ChatConversationModel.findById(conversationId);
  if (!conv) throw new AppError(httpStatus.NOT_FOUND, "Conversation not found.");
  await ChatMessageModel.updateMany(
    { conversation_id: conv._id, sender: "user", readByAdmin: false },
    { $set: { readByAdmin: true } }
  );
  conv.unreadForAdmin = 0;
  await conv.save();
  emitConversationUpdate(serializeConversation(conv.toObject()));
  return { updated: 1 };
};

export const liveChatService = {
  getMyThread,
  sendUserMessage,
  markUserRead,
  listConversations,
  getConversationMessages,
  sendAdminMessage,
  markAdminRead,
};
