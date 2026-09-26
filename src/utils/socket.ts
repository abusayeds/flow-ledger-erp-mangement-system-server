import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";

let io: SocketIOServer;

/** Room every super-admin joins — receives all conversation traffic. */
const ADMIN_ROOM = "chat:admins";
/** Per-user room — that user's own live-chat conversation. */
const userRoom = (userId: string) => `chat:user:${userId}`;

export const initSocketIO = async (server: HttpServer): Promise<void> => {
  console.log("Initializing Socket.IO server...");
  const { Server } = await import("socket.io");
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"],
      credentials: true,
    },
  });

  // Best-effort auth: verify the JWT passed on the handshake so we know which
  // room(s) to join. A missing/invalid token still connects (e.g. legacy demo
  // clients) but joins no chat room, so it can neither send nor receive chat.
  io.use((socket: Socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        (socket.handshake.query?.token as string | undefined);
      if (token) {
        const decoded: any = jwt.verify(
          token,
          process.env.JWT_SECRET_KEY as string
        );
        socket.data.userId = decoded?.user?._id?.toString();
        socket.data.role = decoded?.user?.role;
      }
    } catch {
      // Ignore — unauthenticated socket, just no rooms.
    }
    next();
  });

  console.log("Socket.IO server initialized!");
  io.on("connection", (socket: Socket) => {
    const { userId, role } = socket.data as {
      userId?: string;
      role?: string;
    };

    if (role === "superadmin") {
      socket.join(ADMIN_ROOM);
    } else if (userId) {
      socket.join(userRoom(userId));
    }

    // Admins can subscribe to one user's room to receive that thread live.
    socket.on("chat:join", (targetUserId: string) => {
      if (role === "superadmin" && targetUserId) {
        socket.join(userRoom(String(targetUserId)));
      }
    });
    socket.on("chat:leave", (targetUserId: string) => {
      if (role === "superadmin" && targetUserId) {
        socket.leave(userRoom(String(targetUserId)));
      }
    });

    socket.on("disconnect", () => {
      // no-op
    });
  });
};

export const getIO = (): SocketIOServer => {
  if (!io) throw new Error("Socket.IO is not initialized");
  return io;
};

/**
 * Deliver a live-chat message in real time to both sides of a conversation:
 * the owning user's room and the shared admin room. Fire-and-forget — the DB
 * write is the source of truth; this is just the instant push.
 */
export const emitChatMessage = (ownerUserId: string, payload: unknown): void => {
  if (!io) return;
  io.to(userRoom(ownerUserId)).to(ADMIN_ROOM).emit("chat:message", payload);
};

/** Notify admins that a conversation's summary changed (list re-order/badge). */
export const emitConversationUpdate = (payload: unknown): void => {
  if (!io) return;
  io.to(ADMIN_ROOM).emit("chat:conversation", payload);
};
