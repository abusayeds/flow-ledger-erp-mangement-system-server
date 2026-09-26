import express from "express";
import { contactController } from "./contact.controller";
import { authMiddleware } from "../../../../middlewares/auth";
import { permissionMiddleware } from "../../../../middlewares/permissionMiddleware";
import { role } from "../../../../utils/role";
import { P } from "../shared/support.permissions";

const router = express.Router();
const auth = authMiddleware(role.company, role.staff);

router.get("/all", auth, permissionMiddleware(P.contact.manage_contact, P.contact.view_contact), contactController.getAll);
router.get("/:id", auth, permissionMiddleware(P.contact.view_contact, P.contact.manage_contact), contactController.getSingle);
router.delete("/:id", auth, permissionMiddleware(P.contact.delete_contact), contactController.remove);

export const contactRoutes = router;
