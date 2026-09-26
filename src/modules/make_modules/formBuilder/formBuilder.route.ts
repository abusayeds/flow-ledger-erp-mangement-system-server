import express from "express";
import { formRoutes } from "./form.route";
import { publicFormRoutes } from "./public.route";

const router = express.Router();

// Admin (auth) — build & manage forms, fields, responses, conversion.
router.use("/forms", formRoutes);
// Public (no auth) — view & submit a shared form by its code.
router.use("/public", publicFormRoutes);

export const formBuilderRoutes = router;
