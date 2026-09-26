import express from "express";
import { authMiddleware } from "../../../middlewares/auth";
import { role } from "../../../utils/role";
import { posController } from "./pos.controller";

const router = express.Router();
const auth = authMiddleware(role.company, role.staff, role.customer);

router.get("/dashboard", auth, posController.getDashboard);

router.post("/order/create", auth, posController.createOrder);
router.get("/order/all", auth, posController.getOrders);
router.get("/order/single/:id", auth, posController.getOrder);
router.delete("/order/delete/:id", auth, posController.removeOrder);

export const posRoutes = router;
