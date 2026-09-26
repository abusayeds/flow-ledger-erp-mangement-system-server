import express from "express";
import { pipelineRoutes } from "./pipeline/pipeline.route";
import { leadStageRoutes } from "./leadStage/leadStage.route";
import { dealStageRoutes } from "./dealStage/dealStage.route";
import { sourceRoutes } from "./source/source.route";
import { labelRoutes } from "./label/label.route";
import { leadRoutes } from "./lead/lead.route";
import { dealRoutes } from "./deal/deal.route";
import { crmReportRoutes } from "./report/report.route";
import { authMiddleware } from "../../../middlewares/auth";
import { role } from "../../../utils/role";
import { crmDashboardController } from "./dashboard/crmDashboard.controller";

const router = express.Router();

// Overview dashboard
router.get("/dashboard", authMiddleware(role.company), crmDashboardController.getDashboard);

// Leads & Deals (kanban + sub-features)
router.use("/leads", leadRoutes);
router.use("/deals", dealRoutes);

// System Setup
router.use("/pipelines", pipelineRoutes);
router.use("/lead-stages", leadStageRoutes);
router.use("/deal-stages", dealStageRoutes);
router.use("/sources", sourceRoutes);
router.use("/labels", labelRoutes);

// Reports
router.use("/reports", crmReportRoutes);

export const crmRoutes = router;
