import express from "express";
import { publicSupportController } from "./public.controller";

const router = express.Router();

router.get("/:companyId/bootstrap", publicSupportController.bootstrap);
router.post("/:companyId/tickets", publicSupportController.createTicket);
router.post("/:companyId/tickets/search", publicSupportController.search);
router.get("/:companyId/tickets/:ticketId", publicSupportController.show);
router.post("/:companyId/tickets/:ticketId/reply", publicSupportController.reply);
router.get("/:companyId/knowledge", publicSupportController.knowledge);
router.get("/:companyId/knowledge/:id", publicSupportController.knowledgeArticle);
router.get("/:companyId/faq", publicSupportController.faq);
router.post("/:companyId/contact", publicSupportController.contact);
router.get("/:companyId/page/:slug", publicSupportController.page);
router.get("/:companyId/privacy-policy", publicSupportController.privacyPolicy);
router.get("/:companyId/terms-conditions", publicSupportController.termsConditions);

export const publicSupportRoutes = router;
