import express from "express";
import { sourceController } from "./source.controller";
import { authMiddleware } from "../../../../middlewares/auth";
import { role } from "../../../../utils/role";

const router = express.Router();

router.post("/create", authMiddleware(role.company), sourceController.createSource);
router.get("/all", authMiddleware(role.company), sourceController.getAllSource);
router.get("/:id", authMiddleware(role.company), sourceController.getSingleSource);
router.patch("/:id", authMiddleware(role.company), sourceController.updateSource);
router.delete("/:id", authMiddleware(role.company), sourceController.deleteSource);

export const sourceRoutes = router;
