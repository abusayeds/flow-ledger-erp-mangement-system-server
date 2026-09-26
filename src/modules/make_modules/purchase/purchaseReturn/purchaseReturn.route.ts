import express from "express";
import { authMiddleware } from "../../../../middlewares/auth";
import { role } from "../../../../utils/role";
import { purchaseReturnController } from "./purchaseReturn.controller";

const router = express.Router();
const auth = authMiddleware(role.company);

router.post("/create", auth, purchaseReturnController.create);
router.get("/all", auth, purchaseReturnController.getAll);
router.get("/single/:id", auth, purchaseReturnController.getSingle);
router.patch("/approve/:id", auth, purchaseReturnController.approve);
router.patch("/complete/:id", auth, purchaseReturnController.complete);
router.post("/edit/:id", auth, purchaseReturnController.update);
router.patch("/status/:id", auth, purchaseReturnController.updateStatus);
router.post("/restore/:id", auth, purchaseReturnController.restore);
router.delete("/delete/:id", auth, purchaseReturnController.remove);

export const purchaseReturnRoutes = router;
