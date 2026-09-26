import express from "express";
import { authMiddleware } from "../../../../middlewares/auth";
import { role } from "../../../../utils/role";
import { invoiceReturnController } from "./invoiceReturn.controller";

const router = express.Router();

router.post(
  "/create",
  authMiddleware(role.company),
  invoiceReturnController.createReturn
);

router.get(
  "/all",
  authMiddleware(role.company),
  invoiceReturnController.getAllReturn
);

router.get(
  "/single/:id",
  authMiddleware(role.company),
  invoiceReturnController.getSingleReturn
);

router.post(
  "/approve/:id",
  authMiddleware(role.company),
  invoiceReturnController.approveReturn
);

router.patch(
  "/edit/:id",
  authMiddleware(role.company),
  invoiceReturnController.updateReturn
);

router.delete(
  "/delete/:id",
  authMiddleware(role.company),
  invoiceReturnController.deleteReturn
);

// `delete` is a soft delete, so a trashed invoice return can be brought back.
router.post(
  "/restore/:id",
  authMiddleware(role.company),
  invoiceReturnController.restoreReturn
);

export const invoiceReturnRoutes = router;
