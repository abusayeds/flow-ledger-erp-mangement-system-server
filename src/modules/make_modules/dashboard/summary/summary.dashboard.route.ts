import express from "express";
import { authMiddleware } from "../../../../middlewares/auth";
import { permissionMiddleware } from "../../../../middlewares/permissionMiddleware";
import { permission } from "../../../../utils/permission";
import { role } from "../../../../utils/role";
import { summaryDashboardController } from "./summary.dashboard.controller";

const router = express.Router();
const auth = authMiddleware(role.company, role.hr, role.staff);

router.get(
  "/contacts",
  auth,
  permissionMiddleware(permission.general.dashboard.manage_dashboard),
  summaryDashboardController.getContacts
);

router.get(
  "/",
  auth,
  permissionMiddleware(permission.general.dashboard.manage_dashboard),
  summaryDashboardController.getDashboard
);

export const summaryDashboardRoutes = router;
