import express from "express";
import { ticketFieldController } from "./ticketField.controller";
import { authMiddleware } from "../../../../middlewares/auth";
import { permissionMiddleware } from "../../../../middlewares/permissionMiddleware";
import { role } from "../../../../utils/role";
import { P } from "../shared/support.permissions";

const router = express.Router();
const auth = authMiddleware(role.company, role.staff);

router.post("/create", auth, permissionMiddleware(P.ticket.edit_support_tickets), ticketFieldController.create);
router.get("/all", auth, permissionMiddleware(P.ticket.manage_support_tickets), ticketFieldController.getAll);
router.get("/:id", auth, permissionMiddleware(P.ticket.manage_support_tickets), ticketFieldController.getSingle);
router.patch("/:id", auth, permissionMiddleware(P.ticket.edit_support_tickets), ticketFieldController.update);
router.delete("/:id", auth, permissionMiddleware(P.ticket.edit_support_tickets), ticketFieldController.remove);

export const ticketFieldRoutes = router;
