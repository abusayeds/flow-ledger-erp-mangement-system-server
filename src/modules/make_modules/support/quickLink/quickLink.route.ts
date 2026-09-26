import express from "express";
import { quickLinkController } from "./quickLink.controller";
import { authMiddleware } from "../../../../middlewares/auth";
import { permissionMiddleware } from "../../../../middlewares/permissionMiddleware";
import { role } from "../../../../utils/role";
import { P } from "../shared/support.permissions";

const router = express.Router();
const auth = authMiddleware(role.company, role.staff);

router.post("/create", auth, permissionMiddleware(P.quickLink.create_support_ticket_quick_links), quickLinkController.create);
router.get("/all", auth, permissionMiddleware(P.quickLink.manage_support_ticket_quick_links), quickLinkController.getAll);
router.get("/:id", auth, permissionMiddleware(P.quickLink.manage_support_ticket_quick_links), quickLinkController.getSingle);
router.patch("/:id", auth, permissionMiddleware(P.quickLink.edit_support_ticket_quick_links), quickLinkController.update);
router.delete("/:id", auth, permissionMiddleware(P.quickLink.delete_support_ticket_quick_links), quickLinkController.remove);

export const quickLinkRoutes = router;
