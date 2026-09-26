import express from "express";
import { supportSettingController } from "./settings.controller";
import { authMiddleware } from "../../../../middlewares/auth";
import { role } from "../../../../utils/role";

const router = express.Router();
const auth = authMiddleware(role.company);

router.get("/all", auth, supportSettingController.getAll);
router.patch("/update", auth, supportSettingController.update);
router.get("/:key", auth, supportSettingController.getOne);

export const supportSettingRoutes = router;
