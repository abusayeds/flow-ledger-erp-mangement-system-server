import express from "express";
import { ticketCategoryController } from "./ticketCategory.controller";
import { authMiddleware } from "../../../../middlewares/auth";
import { permissionMiddleware } from "../../../../middlewares/permissionMiddleware";
import { role } from "../../../../utils/role";
import { P } from "../shared/support.permissions";

const router = express.Router();
const auth = authMiddleware(role.company, role.staff);

router.post("/create", auth, permissionMiddleware(P.category.create_ticket_categories), ticketCategoryController.create);
router.get("/all", auth, permissionMiddleware(P.category.manage_ticket_categories), ticketCategoryController.getAll);
router.get("/:id", auth, permissionMiddleware(P.category.manage_ticket_categories), ticketCategoryController.getSingle);
router.patch("/:id", auth, permissionMiddleware(P.category.edit_ticket_categories), ticketCategoryController.update);
router.delete("/:id", auth, permissionMiddleware(P.category.delete_ticket_categories), ticketCategoryController.remove);

export const ticketCategoryRoutes = router;
