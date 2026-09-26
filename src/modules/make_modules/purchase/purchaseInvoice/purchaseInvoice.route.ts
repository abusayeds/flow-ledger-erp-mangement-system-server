import express from "express";
import { authMiddleware } from "../../../../middlewares/auth";
import { role } from "../../../../utils/role";
import { purchaseInvoiceController } from "./purchaseInvoice.controller";

const router = express.Router();
const auth = authMiddleware(role.company);

router.post("/create", auth, purchaseInvoiceController.create);

router.get("/all", auth, purchaseInvoiceController.getAll);

router.get("/single/:id", auth, purchaseInvoiceController.getSingle);

router.patch("/edit/:id", auth, purchaseInvoiceController.update);

router.delete("/delete/:id", auth, purchaseInvoiceController.remove);

// `delete` is a soft delete, so a trashed purchase invoice can be brought back.
router.post("/restore/:id", auth, purchaseInvoiceController.restore);

router.patch("/post/:id", auth, purchaseInvoiceController.post);

router.patch("/status/:id", auth, purchaseInvoiceController.updateStatus);

router.get("/print/:id", auth, purchaseInvoiceController.print);

export const purchaseInvoiceRoutes = router;
