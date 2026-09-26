import express from "express";
import { authMiddleware } from "../../../../middlewares/auth";
import { permissionMiddleware } from "../../../../middlewares/permissionMiddleware";
import { permission } from "../../../../utils/permission";
import { role } from "../../../../utils/role";
import { supportDashboardController } from "./support.dashboard.controller";

const router = express.Router();
const auth = authMiddleware(role.company, role.staff, role.customer, role.vendor);

router.get(
  "/",
  auth,
  permissionMiddleware(permission.supportticket.dashboard.manage_dashboard_support_ticket),
  supportDashboardController.getDashboard
);

export const supportDashboardRoutes = router;
