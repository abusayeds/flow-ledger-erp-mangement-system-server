import express from "express";
import { authMiddleware } from "../../../middlewares/auth";
import { role } from "../../../utils/role";
import { documentEmailController } from "./documentEmail.controller";

const router = express.Router();

router.get(
  "/prepare",
  authMiddleware(role.company),
  documentEmailController.prepare,
);

router.post(
  "/send",
  authMiddleware(role.company),
  documentEmailController.send,
);

export const documentEmailRoutes = router;
