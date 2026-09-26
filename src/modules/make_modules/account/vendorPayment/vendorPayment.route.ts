import express from "express";
import { authMiddleware } from "../../../../middlewares/auth";
import { role } from "../../../../utils/role";
import { vendorPaymentController } from "./vendorPayment.controller";

const router = express.Router();

router.get("/all", authMiddleware(role.company), vendorPaymentController.getAll);
router.post("/create", authMiddleware(role.company), vendorPaymentController.create);
router.post("/record", authMiddleware(role.company), vendorPaymentController.record);
router.get(
  "/vendors/:vendorId/outstanding",
  authMiddleware(role.company),
  vendorPaymentController.getOutstanding
);
// After the more specific /vendors/... route so it can't shadow it.
router.get(
  "/single/:id",
  authMiddleware(role.company),
  vendorPaymentController.getSingle
);
router.patch(
  "/update-status/:id",
  authMiddleware(role.company),
  vendorPaymentController.updateStatus
);
router.delete("/delete/:id", authMiddleware(role.company), vendorPaymentController.remove);

export const vendorPaymentRoutes = router;
