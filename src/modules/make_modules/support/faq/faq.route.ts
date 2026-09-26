import express from "express";
import { faqController } from "./faq.controller";
import { authMiddleware } from "../../../../middlewares/auth";
import { permissionMiddleware } from "../../../../middlewares/permissionMiddleware";
import { role } from "../../../../utils/role";
import { P } from "../shared/support.permissions";

const router = express.Router();
const auth = authMiddleware(role.company, role.staff);

router.post("/create", auth, permissionMiddleware(P.faq.create_faq), faqController.create);
router.get("/all", auth, permissionMiddleware(P.faq.manage_faq), faqController.getAll);
router.post("/import/preview", auth, permissionMiddleware(P.faq.create_faq), faqController.importPreview);
router.post("/import", auth, permissionMiddleware(P.faq.create_faq), faqController.importData);
router.get("/:id", auth, permissionMiddleware(P.faq.manage_faq), faqController.getSingle);
router.patch("/:id", auth, permissionMiddleware(P.faq.edit_faq), faqController.update);
router.delete("/:id", auth, permissionMiddleware(P.faq.delete_faq), faqController.remove);

export const faqRoutes = router;
