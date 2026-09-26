import express from "express";
import { authMiddleware } from "../../../middlewares/auth";
import { role } from "../../../utils/role";
import { superadminController } from "./superadmin.controller";

const router = express.Router();
const auth = authMiddleware(role.superadmin);

router.get("/overview", auth, superadminController.overview);
router.get("/users", auth, superadminController.users);
router.get("/companies", auth, superadminController.companies);
router.get("/companies/:id", auth, superadminController.companyDetail);
router.get("/subscriptions", auth, superadminController.subscriptions);
router.post("/subscriptions/assign", auth, superadminController.assignSubscription);
router.patch("/subscriptions/:id", auth, superadminController.updateSubscription);
router.post("/impersonate/:id", auth, superadminController.impersonate);
router.get("/payments", auth, superadminController.payments);
router.post("/payments/:id/refund", auth, superadminController.refundPayment);
router.get("/admins", auth, superadminController.listAdmins);
router.post("/admins", auth, superadminController.createAdmin);
router.delete("/admins/:id", auth, superadminController.removeAdmin);

export const superadminRoutes = router;
