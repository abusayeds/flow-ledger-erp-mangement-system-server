import express from "express";
import { authMiddleware } from "../../../../middlewares/auth";
import { permissionMiddleware } from "../../../../middlewares/permissionMiddleware";
import { permission } from "../../../../utils/permission";
import { role } from "../../../../utils/role";
import { crmDashboardController } from "./crm.dashboard.controller";

const router = express.Router();
const auth = authMiddleware(role.company, role.staff, role.customer);

router.get(
  "/",
  auth,
  permissionMiddleware(permission.lead.lead.manage_crm_dashboard),
  crmDashboardController.getDashboard
);

export const crmDashboardRoutes = router;
