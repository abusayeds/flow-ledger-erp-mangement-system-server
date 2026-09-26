import { Types } from "mongoose";

export type TChatSender = "user" | "admin" | "bot";
export type TChatStatus = "open" | "closed";

/** One live-support conversation per app user (company ↔ Qyad Support team). */
export interface TChatConversation {
  _id?: Types.ObjectId;
  /** The app user (company/staff/etc.) this conversation belongs to. Unique. */
  user_id: Types.ObjectId;
  /** Preview of the most recent message, for the admin conversation list. */
  lastMessageText?: string;
  lastMessageAt?: Date;
  lastSender?: TChatSender;
  /** Unread counters, cleared by the respective read endpoint. */
  unreadForAdmin: number;
  unreadForUser: number;
  /** How many scripted intro auto-replies the bot has already sent (cap 2). */
  botIntroCount: number;
  status: TChatStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TChatMessage {
  _id?: Types.ObjectId;
  conversation_id: Types.ObjectId;
  sender: TChatSender;
  /** The admin/user that authored the message (null for bot). */
  senderUser_id?: Types.ObjectId | null;
  text: string;
  readByAdmin: boolean;
  readByUser: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
