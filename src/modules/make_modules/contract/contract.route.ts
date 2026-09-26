import express from "express";
import { authMiddleware } from "../../../middlewares/auth";
import { role } from "../../../utils/role";
import { contractController } from "./contract.controller";

const router = express.Router();
const auth = authMiddleware(role.company);

router.post("/create", auth, contractController.create);
router.get("/all", auth, contractController.getAll);
router.get("/single/:id", auth, contractController.getSingle);
router.patch("/:id", auth, contractController.update);
router.delete("/:id", auth, contractController.remove);

export const contractRoutes = router;
