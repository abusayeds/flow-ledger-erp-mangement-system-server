import express from "express";
import { taxGroupController } from "./taxGroup.controller";
import { authMiddleware } from "../../../../middlewares/auth";
import { role } from "../../../../utils/role";

const router = express.Router();

router.post("/create", authMiddleware(role.company), taxGroupController.createTaxGroup);
router.get("/all", authMiddleware(role.company), taxGroupController.getAllTaxGroup);
router.get("/:id", authMiddleware(role.company), taxGroupController.getSingleTaxGroup);
router.patch("/:id", authMiddleware(role.company), taxGroupController.updateTaxGroup);
router.delete("/:id", authMiddleware(role.company), taxGroupController.deleteTaxGroup);

export const taxGroupRoutes = router;
