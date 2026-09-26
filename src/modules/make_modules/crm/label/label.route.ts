import express from "express";
import { labelController } from "./label.controller";
import { authMiddleware } from "../../../../middlewares/auth";
import { role } from "../../../../utils/role";

const router = express.Router();

router.post("/create", authMiddleware(role.company), labelController.createLabel);
router.get("/all", authMiddleware(role.company), labelController.getAllLabel);
router.get("/:id", authMiddleware(role.company), labelController.getSingleLabel);
router.patch("/:id", authMiddleware(role.company), labelController.updateLabel);
router.delete("/:id", authMiddleware(role.company), labelController.deleteLabel);

export const labelRoutes = router;
