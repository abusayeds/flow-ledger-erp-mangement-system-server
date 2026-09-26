import express from "express";
import { leadStageController } from "./leadStage.controller";
import { authMiddleware } from "../../../../middlewares/auth";
import { role } from "../../../../utils/role";

const router = express.Router();

router.post("/create", authMiddleware(role.company), leadStageController.createLeadStage);
router.get("/all", authMiddleware(role.company), leadStageController.getAllLeadStage);
router.post("/order", authMiddleware(role.company), leadStageController.updateOrder);
router.get("/:id", authMiddleware(role.company), leadStageController.getSingleLeadStage);
router.patch("/:id", authMiddleware(role.company), leadStageController.updateLeadStage);
router.delete("/:id", authMiddleware(role.company), leadStageController.deleteLeadStage);

export const leadStageRoutes = router;
