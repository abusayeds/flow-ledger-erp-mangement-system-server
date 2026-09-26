import express from "express";
import { formController } from "./form.controller";
import { authMiddleware } from "../../../middlewares/auth";
import { role } from "../../../utils/role";

const router = express.Router();
const auth = authMiddleware(role.company);

router.get("/conversion-modules", auth, formController.conversionModules);
router.post("/create", auth, formController.createForm);
router.get("/all", auth, formController.getAllForm);

router.get("/:id", auth, formController.getSingleForm);
router.patch("/:id", auth, formController.updateForm);
router.delete("/:id", auth, formController.deleteForm);

router.put("/:id/fields", auth, formController.updateFields);
router.delete("/:id/fields/:fieldId", auth, formController.deleteField);

router.get("/:id/responses", auth, formController.getResponses);
router.get("/:id/responses/:responseId", auth, formController.getSingleResponse);
router.delete("/:id/responses/:responseId", auth, formController.deleteResponse);

router.get("/:id/conversion", auth, formController.getConversion);
router.post("/:id/conversion", auth, formController.updateConversion);

export const formRoutes = router;
