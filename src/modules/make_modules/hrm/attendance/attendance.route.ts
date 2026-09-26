import express from "express";
import { attendanceController } from "./attendance.controller";
import { hrmAuth, perm, permission } from "../shared/hrm.routeAuth";

const router = express.Router();
const a = permission.hrm.attendances;

router.get("/", hrmAuth, perm(a.manage_attendances), attendanceController.list);
// Monthly grid (employees × days) for the attendance calendar view.
router.get("/grid", hrmAuth, perm(a.manage_attendances), attendanceController.grid);
router.post("/", hrmAuth, perm(a.create_attendances), attendanceController.create);
router.get(
  "/clock-status",
  hrmAuth,
  perm(a.clock_in, a.clock_out, a.manage_own_attendances),
  attendanceController.clockStatus,
);
router.post("/clock-in-out", hrmAuth, perm(a.clock_in, a.clock_out), attendanceController.clockInOut);
router.post("/history", hrmAuth, perm(a.manage_own_attendances), attendanceController.history);
router.put("/:id", hrmAuth, perm(a.edit_attendances), attendanceController.update);
router.delete("/:id", hrmAuth, perm(a.delete_attendances), attendanceController.remove);

export const attendanceRoutes = router;
