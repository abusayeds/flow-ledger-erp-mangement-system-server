import express from "express";
import { pipelineController } from "./pipeline.controller";
import { authMiddleware } from "../../../../middlewares/auth";
import { role } from "../../../../utils/role";

const router = express.Router();

router.post("/create", authMiddleware(role.company), pipelineController.createPipeline);
router.get("/all", authMiddleware(role.company), pipelineController.getAllPipeline);
router.get("/:id", authMiddleware(role.company), pipelineController.getSinglePipeline);
router.patch("/:id", authMiddleware(role.company), pipelineController.updatePipeline);
router.delete("/:id", authMiddleware(role.company), pipelineController.deletePipeline);

export const pipelineRoutes = router;
