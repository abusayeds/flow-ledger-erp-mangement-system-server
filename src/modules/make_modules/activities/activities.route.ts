import express from "express";
import { authMiddleware } from "../../../middlewares/auth";
import { role } from "../../../utils/role";
import { activitiesController } from "./activities.controller";

const router = express.Router();

router.get("/all", authMiddleware(role.company), activitiesController.getAllActivities);
router.get(
  "/:module/:entityId",
  authMiddleware(role.company),
  activitiesController.getEntityActivities
);

export const activitiesRoutes = router;
