import { Schema, model } from "mongoose";
import { TChatConversation, TChatMessage } from "./liveChat.interface";

const conversationSchema = new Schema<TChatConversation>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    lastMessageText: { type: String },
    lastMessageAt: { type: Date },
    lastSender: { type: String, enum: ["user", "admin", "bot"] },
    unreadForAdmin: { type: Number, default: 0 },
    unreadForUser: { type: Number, default: 0 },
    botIntroCount: { type: Number, default: 0 },
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

const messageSchema = new Schema<TChatMessage>(
  {
    conversation_id: {
      type: Schema.Types.ObjectId,
      ref: "LiveChatConversation",
      required: true,
      index: true,
    },
    sender: { type: String, enum: ["user", "admin", "bot"], required: true },
    senderUser_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
    text: { type: String, required: true, trim: true },
    readByAdmin: { type: Boolean, default: false },
    readByUser: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Thread ordering: newest last within a conversation.
messageSchema.index({ conversation_id: 1, createdAt: 1 });

export const ChatConversationModel = model<TChatConversation>(
  "LiveChatConversation",
  conversationSchema
);
export const ChatMessageModel = model<TChatMessage>(
  "LiveChatMessage",
  messageSchema
);
