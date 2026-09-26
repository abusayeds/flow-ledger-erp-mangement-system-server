import express from "express";
import { authMiddleware } from "../../../middlewares/auth";
import { role } from "../../../utils/role";
import { timeLogController } from "./timeLog.controller";

const router = express.Router();
const auth = authMiddleware(role.company, role.staff, role.customer);

router.post("/create", auth, timeLogController.create);
router.get("/all", auth, timeLogController.getAll);
router.patch("/:id", auth, timeLogController.update);
router.delete("/delete/:id", auth, timeLogController.remove);

export const timeLogRoutes = router;
