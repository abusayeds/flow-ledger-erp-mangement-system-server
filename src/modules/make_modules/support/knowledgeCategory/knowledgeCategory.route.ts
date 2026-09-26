import express from "express";
import { knowledgeCategoryController } from "./knowledgeCategory.controller";
import { authMiddleware } from "../../../../middlewares/auth";
import { permissionMiddleware } from "../../../../middlewares/permissionMiddleware";
import { role } from "../../../../utils/role";
import { P } from "../shared/support.permissions";

const router = express.Router();
const auth = authMiddleware(role.company, role.staff);

router.post("/create", auth, permissionMiddleware(P.knowledge.create_knowledge_base), knowledgeCategoryController.create);
router.get("/all", auth, permissionMiddleware(P.knowledge.manage_knowledge_base), knowledgeCategoryController.getAll);
router.post("/import", auth, permissionMiddleware(P.knowledge.create_knowledge_base), knowledgeCategoryController.importData);
router.get("/:id", auth, permissionMiddleware(P.knowledge.manage_knowledge_base), knowledgeCategoryController.getSingle);
router.patch("/:id", auth, permissionMiddleware(P.knowledge.edit_knowledge_base), knowledgeCategoryController.update);
router.delete("/:id", auth, permissionMiddleware(P.knowledge.delete_knowledge_base), knowledgeCategoryController.remove);

export const knowledgeCategoryRoutes = router;
