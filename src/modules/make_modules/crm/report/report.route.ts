import express from "express";
import { crmReportController } from "./report.controller";
import { authMiddleware } from "../../../../middlewares/auth";
import { role } from "../../../../utils/role";

const router = express.Router();

router.get("/leads", authMiddleware(role.company), crmReportController.leadReports);
router.get("/deals", authMiddleware(role.company), crmReportController.dealReports);

export const crmReportRoutes = router;
