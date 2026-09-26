import express from "express";
import { authMiddleware } from "../../../../middlewares/auth";
import { role } from "../../../../utils/role";
import { reportController } from "./report.controller";

const router = express.Router();

router.get("/", authMiddleware(role.company), reportController.index);
router.get("/list", authMiddleware(role.company), reportController.list);
router.get("/summary", authMiddleware(role.company), reportController.summary);
router.get("/invoice-aging", authMiddleware(role.company), reportController.invoiceAging);
router.get("/bill-aging", authMiddleware(role.company), reportController.billAging);
router.get("/tax-summary", authMiddleware(role.company), reportController.taxSummary);
router.get("/customer-balance", authMiddleware(role.company), reportController.customerBalance);
router.get("/vendor-balance", authMiddleware(role.company), reportController.vendorBalance);
router.get(
  "/customers/:customerId",
  authMiddleware(role.company),
  reportController.customerDetail
);
router.get("/vendors/:vendorId", authMiddleware(role.company), reportController.vendorDetail);

export const reportRoutes = router;
