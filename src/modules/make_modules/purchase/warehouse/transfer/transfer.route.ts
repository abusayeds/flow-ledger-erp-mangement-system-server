import express from "express";
import { authMiddleware } from "../../../../../middlewares/auth";
import { role } from "../../../../../utils/role";
import { transferController } from "./transfer.controller";

const router = express.Router();
const auth = authMiddleware(role.company);

router.post("/create", auth, transferController.createTransfer);
router.get("/all", auth, transferController.getAllTransfer);
router.get("/single/:id", auth, transferController.getSingleTransfer);
router.delete("/delete/:id", auth, transferController.removeTransfer);
// `delete` is now a soft delete, so a trashed transfer can be brought back.
router.post("/restore/:id", auth, transferController.restoreTransfer);

export const transferRoutes = router;
