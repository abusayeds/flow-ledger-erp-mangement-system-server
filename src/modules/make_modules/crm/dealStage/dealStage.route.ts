import express from "express";
import { dealStageController } from "./dealStage.controller";
import { authMiddleware } from "../../../../middlewares/auth";
import { role } from "../../../../utils/role";

const router = express.Router();

router.post("/create", authMiddleware(role.company), dealStageController.createDealStage);
router.get("/all", authMiddleware(role.company), dealStageController.getAllDealStage);
router.post("/order", authMiddleware(role.company), dealStageController.updateOrder);
router.get("/:id", authMiddleware(role.company), dealStageController.getSingleDealStage);
router.patch("/:id", authMiddleware(role.company), dealStageController.updateDealStage);
router.delete("/:id", authMiddleware(role.company), dealStageController.deleteDealStage);

export const dealStageRoutes = router;
