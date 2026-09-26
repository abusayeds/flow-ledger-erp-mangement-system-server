import express from "express";
import { authMiddleware } from "../../../middlewares/auth";
import { role } from "../../../utils/role";
import { companyRegisterController } from "./companyRegister.controller";

const router = express.Router();
const auth = authMiddleware(role.company);

router.post("/create", auth, companyRegisterController.create);
router.get("/all", auth, companyRegisterController.getAll);
router.get("/single/:id", auth, companyRegisterController.getSingle);
router.patch("/:id", auth, companyRegisterController.update);
router.delete("/:id", auth, companyRegisterController.remove);

export const companyRegisterRoutes = router;
