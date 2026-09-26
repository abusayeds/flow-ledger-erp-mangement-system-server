import express from "express";
import { authMiddleware } from "../../../../middlewares/auth";
import { permissionMiddleware } from "../../../../middlewares/permissionMiddleware";
import { role } from "../../../../utils/role";
import { setupController } from "./setup.controller";
import { P } from "../shared/support.permissions";

const router = express.Router();
const auth = authMiddleware(role.company, role.staff);

router.get("/brand-settings", auth, permissionMiddleware(P.brand.manage_support_ticket_brand_settings), setupController.getBrand);
router.patch("/brand-settings", auth, permissionMiddleware(P.brand.manage_support_ticket_brand_settings, P.customPage.edit_support_ticket_brand_settings), setupController.updateBrand);

router.get("/title-sections", auth, permissionMiddleware(P.titleSection.manage_support_ticket_title_sections), setupController.getTitleSections);
router.patch("/title-sections", auth, permissionMiddleware(P.titleSection.edit_support_ticket_title_sections), setupController.saveTitleSections);

router.get("/cta-sections", auth, permissionMiddleware(P.ctaSection.manage_support_ticket_cta_sections), setupController.getCtaSections);
router.patch("/cta-sections", auth, permissionMiddleware(P.ctaSection.create_support_ticket_cta_sections, P.ctaSection.manage_support_ticket_cta_sections), setupController.saveCtaSections);

router.get("/support-information", auth, permissionMiddleware(P.supportInfo.manage_support_ticket_support_information), setupController.getSupportInformation);
router.patch("/support-information", auth, permissionMiddleware(P.supportInfo.manage_support_ticket_support_information, P.quickLink.edit_support_ticket_support_information), setupController.saveSupportInformation);

router.get("/contact-information", auth, permissionMiddleware(P.contactInfo.manage_support_ticket_contact_information), setupController.getContactInformation);
router.patch("/contact-information", auth, permissionMiddleware(P.contactInfo.manage_support_ticket_contact_information), setupController.saveContactInformation);

export const setupRoutes = router;
