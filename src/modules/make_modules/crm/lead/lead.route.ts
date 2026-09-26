import express from "express";
import { leadController } from "./lead.controller";
import { authMiddleware } from "../../../../middlewares/auth";
import { role } from "../../../../utils/role";

const router = express.Router();
const auth = authMiddleware(role.company);

router.post("/create", auth, leadController.createLead);
router.get("/all", auth, leadController.getAllLead);
router.post("/order", auth, leadController.order);

router.get("/:id", auth, leadController.getSingleLead);
router.patch("/:id", auth, leadController.updateLead);
router.delete("/:id", auth, leadController.deleteLead);
router.patch("/:id/labels", auth, leadController.updateLabels);
router.post("/:id/convert-to-deal", auth, leadController.convertToDeal);

router.post("/:id/assign-users", auth, leadController.assignUser);
router.delete("/:id/users/:userId", auth, leadController.removeUser);
router.post("/:id/assign-products", auth, leadController.assignProduct);
router.delete("/:id/products/:productId", auth, leadController.removeProduct);
router.post("/:id/assign-sources", auth, leadController.assignSource);
router.delete("/:id/sources/:sourceId", auth, leadController.removeSource);

router.post("/:id/tasks", auth, leadController.addTask);
router.patch("/:id/tasks/:subId", auth, leadController.updateTask);
router.delete("/:id/tasks/:subId", auth, leadController.removeTask);
router.post("/:id/calls", auth, leadController.addCall);
router.patch("/:id/calls/:subId", auth, leadController.updateCall);
router.delete("/:id/calls/:subId", auth, leadController.removeCall);
router.post("/:id/emails", auth, leadController.addEmail);
router.delete("/:id/emails/:subId", auth, leadController.removeEmail);
router.post("/:id/discussions", auth, leadController.addDiscussion);
router.delete("/:id/discussions/:subId", auth, leadController.removeDiscussion);
router.post("/:id/files", auth, leadController.addFile);
router.delete("/:id/files/:subId", auth, leadController.removeFile);

export const leadRoutes = router;
