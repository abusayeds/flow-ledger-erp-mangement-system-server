import express from "express";
import { authMiddleware } from "../../../../middlewares/auth";
import { role } from "../../../../utils/role";
import { checkoutController } from "./checkout.controller";

const router = express.Router();

router.post("/checkout", authMiddleware(role.company), checkoutController.createCheckout);

// Public landing pages Stripe redirects the browser to (no auth/token in a redirect).
router.get("/checkout/success", checkoutController.checkoutSuccess);
router.get("/checkout/cancel", checkoutController.checkoutCancel);
router.post("/assign-free", authMiddleware(role.company), checkoutController.assignFree);
router.post("/start-trial", authMiddleware(role.company), checkoutController.startTrial);
router.get("/my-subscription",authMiddleware(role.company, role.hr, role.staff),checkoutController.mySubscription);
router.post("/cancel", authMiddleware(role.company), checkoutController.cancelSubscription);

export const checkoutRoutes = router;
