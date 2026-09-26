import express from "express";
import { knowledgeController } from "./knowledge.controller";
import { authMiddleware } from "../../../../middlewares/auth";
import { permissionMiddleware } from "../../../../middlewares/permissionMiddleware";
import { role } from "../../../../utils/role";
import { P } from "../shared/support.permissions";

const router = express.Router();
const auth = authMiddleware(role.company, role.staff);

router.post("/create", auth, permissionMiddleware(P.knowledge.create_knowledge_base), knowledgeController.create);
router.get("/all", auth, permissionMiddleware(P.knowledge.manage_knowledge_base), knowledgeController.getAll);
router.post("/import/preview", auth, permissionMiddleware(P.knowledge.create_knowledge_base), knowledgeController.importPreview);
router.post("/import", auth, permissionMiddleware(P.knowledge.create_knowledge_base), knowledgeController.importData);
router.get("/:id", auth, permissionMiddleware(P.knowledge.manage_knowledge_base), knowledgeController.getSingle);
router.patch("/:id", auth, permissionMiddleware(P.knowledge.edit_knowledge_base), knowledgeController.update);
router.delete("/:id", auth, permissionMiddleware(P.knowledge.delete_knowledge_base), knowledgeController.remove);

export const knowledgeRoutes = router;
