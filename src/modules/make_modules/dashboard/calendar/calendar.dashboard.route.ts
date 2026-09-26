import express from "express";
import { authMiddleware } from "../../../../middlewares/auth";
import { role } from "../../../../utils/role";
import { calendarDashboardController } from "./calendar.dashboard.controller";

const router = express.Router();
const auth = authMiddleware(role.company, role.staff, role.customer);

router.get("/", auth, calendarDashboardController.getEventCalendar);

export const calendarDashboardRoutes = router;
