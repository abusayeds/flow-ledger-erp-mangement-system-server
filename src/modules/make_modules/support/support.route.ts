import express from "express";
import { ticketRoutes } from "./ticket/ticket.route";
import { ticketCategoryRoutes } from "./ticketCategory/ticketCategory.route";
import { knowledgeRoutes } from "./knowledge/knowledge.route";
import { knowledgeCategoryRoutes } from "./knowledgeCategory/knowledgeCategory.route";
import { faqRoutes } from "./faq/faq.route";
import { contactRoutes } from "./contact/contact.route";
import { customPageRoutes } from "./customPage/customPage.route";
import { quickLinkRoutes } from "./quickLink/quickLink.route";
import { ticketFieldRoutes } from "./ticketField/ticketField.route";
import { setupRoutes } from "./setup/setup.route";
import { publicSupportRoutes } from "./public/public.route";
import { authMiddleware } from "../../../middlewares/auth";
import { role } from "../../../utils/role";
import { supportDashboardController } from "./dashboard/supportDashboard.controller";

const router = express.Router();

// Overview dashboard
router.get("/dashboard", authMiddleware(role.company), supportDashboardController.getDashboard);

// Main sections (Laravel sidebar order — dashboard skipped)
router.use("/tickets", ticketRoutes);
router.use("/knowledge", knowledgeRoutes);
router.use("/faq", faqRoutes);
router.use("/contact", contactRoutes);

// System Setup
router.use("/setup", setupRoutes);
router.use("/ticket-categories", ticketCategoryRoutes);
router.use("/knowledge-categories", knowledgeCategoryRoutes);
router.use("/custom-pages", customPageRoutes);
router.use("/quick-links", quickLinkRoutes);
router.use("/ticket-fields", ticketFieldRoutes);

// Public portal (no auth)
router.use("/public", publicSupportRoutes);

export const supportRoutes = router;
