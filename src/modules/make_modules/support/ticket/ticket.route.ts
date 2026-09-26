import express from "express";
import { ticketController } from "./ticket.controller";
import { authMiddleware } from "../../../../middlewares/auth";
import { permissionMiddleware } from "../../../../middlewares/permissionMiddleware";
import { role } from "../../../../utils/role";
import { P } from "../shared/support.permissions";

const router = express.Router();
const auth = authMiddleware(role.company, role.staff, role.customer, role.vendor);
const view = permissionMiddleware(P.ticket.manage_support_tickets, P.ticket.view_support_tickets);

router.get("/request-data", auth, view, ticketController.getRequestData);
router.post("/create", auth, permissionMiddleware(P.ticket.create_support_tickets), ticketController.create);
router.get("/all", auth, view, ticketController.getAll);
router.get("/:id", auth, view, ticketController.getSingle);
router.patch("/:id", auth, permissionMiddleware(P.ticket.edit_support_tickets), ticketController.update);
router.delete("/:id", auth, permissionMiddleware(P.ticket.delete_support_tickets), ticketController.remove);
router.patch("/:id/status", auth, permissionMiddleware(P.ticket.edit_support_tickets), ticketController.changeStatus);
router.post("/:id/note", auth, permissionMiddleware(P.ticket.edit_support_tickets), ticketController.storeNote);
router.post("/:id/reply", auth, permissionMiddleware(P.ticket.reply_support_tickets), ticketController.addReply);
router.patch("/:id/reply/:replyId", auth, permissionMiddleware(P.ticket.edit_support_tickets), ticketController.updateReply);
router.delete("/:id/reply/:replyId", auth, permissionMiddleware(P.ticket.edit_support_tickets), ticketController.deleteReply);
router.delete("/:id/attachment", auth, permissionMiddleware(P.ticket.edit_support_tickets), ticketController.deleteAttachment);

export const ticketRoutes = router;
