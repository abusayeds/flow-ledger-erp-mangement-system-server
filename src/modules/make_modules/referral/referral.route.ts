import express from "express";
import { authMiddleware } from "../../../middlewares/auth";
import { role } from "../../../utils/role";
import { referralController } from "./referral.controller";

const router = express.Router();
const auth = authMiddleware(role.company);

router.post("/invite", auth, referralController.create);
router.get("/all", auth, referralController.getAll);

export const referralRoutes = router;
