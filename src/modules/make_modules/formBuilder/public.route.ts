import express from "express";
import { publicFormController } from "./public.controller";

// No auth — the form is shared publicly by its code.
const router = express.Router();

router.get("/:code", publicFormController.showForm);
router.post("/:code/submit", publicFormController.submitForm);

export const publicFormRoutes = router;
