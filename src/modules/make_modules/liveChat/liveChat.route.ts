import express from "express";
import { authMiddleware } from "../../../middlewares/auth";
import { role } from "../../../utils/role";
import { liveChatController } from "./liveChat.controller";

const router = express.Router();

// ── App user: my own "Chat with us" conversation (any authenticated user) ──
const auth = authMiddleware();
router.get("/me", auth, liveChatController.getMyThread);
router.post("/me/messages", auth, liveChatController.sendMyMessage);
router.post("/me/read", auth, liveChatController.markMyRead);

// ── Super-admin dashboard: manage/reply to all conversations ──
const admin = authMiddleware(role.superadmin);
router.get("/conversations", admin, liveChatController.listConversations);
router.get("/conversations/:id/messages", admin, liveChatController.getConversationMessages);
router.post("/conversations/:id/messages", admin, liveChatController.sendAdminMessage);
router.post("/conversations/:id/read", admin, liveChatController.markAdminRead);

export const liveChatRoutes = router;
