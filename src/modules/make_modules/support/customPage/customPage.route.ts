import express from "express";
import { customPageController } from "./customPage.controller";
import { authMiddleware } from "../../../../middlewares/auth";
import { permissionMiddleware } from "../../../../middlewares/permissionMiddleware";
import { role } from "../../../../utils/role";
import { P } from "../shared/support.permissions";

const router = express.Router();
const auth = authMiddleware(role.company, role.staff);

router.post("/create", auth, permissionMiddleware(P.customPage.create_support_ticket_custom_pages), customPageController.create);
router.get("/all", auth, permissionMiddleware(P.customPage.manage_support_ticket_custom_pages), customPageController.getAll);
router.get("/:id", auth, permissionMiddleware(P.customPage.manage_support_ticket_custom_pages), customPageController.getSingle);
router.patch("/:id", auth, permissionMiddleware(P.customPage.edit_support_ticket_custom_pages), customPageController.update);
router.delete("/:id", auth, permissionMiddleware(P.customPage.delete_support_ticket_custom_pages), customPageController.remove);

export const customPageRoutes = router;
