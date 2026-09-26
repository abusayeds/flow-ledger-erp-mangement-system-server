import express from "express";
import { authMiddleware } from "../../../middlewares/auth";
import { role } from "../../../utils/role";
import { enforcePlanLimit } from "../subscription/guard/subscription.guard";
import { customerController } from "./customer.controller";

const router = express.Router();

router.post(
  "/create",
  authMiddleware(role.company),
  enforcePlanLimit("users"),
  customerController.customerCreate
);
router.get(
  "/all",
  authMiddleware(role.company),
  customerController.allCustomer
);

router.get(
  "/invoice-list",
  authMiddleware(role.company),
  customerController.invoiceCustomerList
);

router.get(
  "/single/:id",
  authMiddleware(role.company),
  customerController.singleCustomer
);
router.delete(
  "/delete/:id",
  authMiddleware(role.company),
  customerController.deleteCustomer
);
router.post(
  "/update",
  authMiddleware(role.company),
  customerController.updateCustomer
);


router.post(
  "/merge",
  authMiddleware(role.company),
  customerController.mergeCustomers
);

export const customerRoutes = router;