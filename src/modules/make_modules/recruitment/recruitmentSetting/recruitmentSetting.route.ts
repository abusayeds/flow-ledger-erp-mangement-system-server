import express from "express";
import { authMiddleware } from "../../../../middlewares/auth";
import { permissionMiddleware } from "../../../../middlewares/permissionMiddleware";
import { permission } from "../../../../utils/permission";
import { role } from "../../../../utils/role";
import { recruitmentSettingController as C } from "./recruitmentSetting.controller";

const router = express.Router();
const auth = authMiddleware(role.company, role.hr);
const P = permission.recruitment.setting;

router.get("/brand-settings", auth, permissionMiddleware(P.manage_recruitment_brand_settings), C.brandSettingsGet);
router.post("/brand-settings", auth, permissionMiddleware(P.manage_recruitment_brand_settings), C.brandSettingsUpdate);

router.get("/about-company", auth, permissionMiddleware(P.manage_about_company), C.aboutCompanyGet);
router.post("/about-company", auth, permissionMiddleware(P.manage_about_company), C.aboutCompanyUpdate);

router.get("/application-tips", auth, permissionMiddleware(P.manage_application_tips), C.applicationTipsGet);
router.post("/application-tips", auth, permissionMiddleware(P.manage_application_tips), C.applicationTipsUpdate);

router.get("/what-happens-next", auth, permissionMiddleware(P.manage_what_happens_next), C.whatHappensNextGet);
router.post("/what-happens-next", auth, permissionMiddleware(P.manage_what_happens_next), C.whatHappensNextUpdate);

router.get("/need-help", auth, permissionMiddleware(P.manage_need_help), C.needHelpGet);
router.post("/need-help", auth, permissionMiddleware(P.manage_need_help), C.needHelpUpdate);

router.get("/tracking-faq", auth, permissionMiddleware(P.manage_tracking_faq), C.trackingFaqGet);
router.post("/tracking-faq", auth, permissionMiddleware(P.manage_tracking_faq), C.trackingFaqUpdate);

router.get("/offer-letter-template", auth, permissionMiddleware(P.manage_offer_letter_template), C.offerLetterTemplateGet);
router.post("/offer-letter-template", auth, permissionMiddleware(P.manage_offer_letter_template), C.offerLetterTemplateUpdate);
router.get("/offer-letter-placeholders", auth, permissionMiddleware(P.manage_offer_letter_template), C.getPlaceholders);

router.get("/dashboard-welcome-card", auth, permissionMiddleware(P.manage_recruitment_dashboard_welcome_card), C.dashboardWelcomeCardGet);
router.post("/dashboard-welcome-card", auth, permissionMiddleware(P.manage_recruitment_dashboard_welcome_card), C.dashboardWelcomeCardUpdate);

export const recruitmentSettingRoutes = router;
