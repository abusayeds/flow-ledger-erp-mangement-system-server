import express from "express";
import { dealController } from "./deal.controller";
import { authMiddleware } from "../../../../middlewares/auth";
import { role } from "../../../../utils/role";

const router = express.Router();
const auth = authMiddleware(role.company);

router.post("/create", auth, dealController.createDeal);
router.get("/all", auth, dealController.getAllDeal);
router.post("/order", auth, dealController.order);

router.get("/:id", auth, dealController.getSingleDeal);
router.patch("/:id", auth, dealController.updateDeal);
router.delete("/:id", auth, dealController.deleteDeal);
router.patch("/:id/status", auth, dealController.changeStatus);
router.patch("/:id/labels", auth, dealController.updateLabels);

router.post("/:id/assign-users", auth, dealController.assignUser);
router.delete("/:id/users/:userId", auth, dealController.removeUser);
router.post("/:id/assign-products", auth, dealController.assignProduct);
router.delete("/:id/products/:productId", auth, dealController.removeProduct);
router.post("/:id/assign-sources", auth, dealController.assignSource);
router.delete("/:id/sources/:sourceId", auth, dealController.removeSource);
router.post("/:id/assign-clients", auth, dealController.assignClient);
router.delete("/:id/clients/:clientId", auth, dealController.removeClient);

router.post("/:id/tasks", auth, dealController.addTask);
router.patch("/:id/tasks/:subId", auth, dealController.updateTask);
router.delete("/:id/tasks/:subId", auth, dealController.removeTask);
router.post("/:id/calls", auth, dealController.addCall);
router.patch("/:id/calls/:subId", auth, dealController.updateCall);
router.delete("/:id/calls/:subId", auth, dealController.removeCall);
router.post("/:id/emails", auth, dealController.addEmail);
router.delete("/:id/emails/:subId", auth, dealController.removeEmail);
router.post("/:id/discussions", auth, dealController.addDiscussion);
router.delete("/:id/discussions/:subId", auth, dealController.removeDiscussion);
router.post("/:id/files", auth, dealController.addFile);
router.delete("/:id/files/:subId", auth, dealController.removeFile);

export const dealRoutes = router;
