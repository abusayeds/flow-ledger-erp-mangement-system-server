import express from "express";
import { jobTypeRoutes } from "./jobType/jobType.route";
import { candidateSourceRoutes } from "./candidateSource/candidateSource.route";
import { interviewTypeRoutes } from "./interviewType/interviewType.route";
import { jobLocationRoutes } from "./jobLocation/jobLocation.route";
import { customQuestionRoutes } from "./customQuestion/customQuestion.route";
import { interviewRoundRoutes } from "./interviewRound/interviewRound.route";
import { onboardingChecklistRoutes } from "./onboardingChecklist/onboardingChecklist.route";
import { checklistItemRoutes } from "./checklistItem/checklistItem.route";
import { candidateAssessmentRoutes } from "./candidateAssessment/candidateAssessment.route";
import { interviewFeedbackRoutes } from "./interviewFeedback/interviewFeedback.route";
import { jobPostingRoutes } from "./jobPosting/jobPosting.route";
import { candidateRoutes } from "./candidate/candidate.route";
import { interviewRoutes } from "./interview/interview.route";
import { offerRoutes } from "./offer/offer.route";
import { candidateOnboardingRoutes } from "./candidateOnboarding/candidateOnboarding.route";
import { recruitmentSettingRoutes } from "./recruitmentSetting/recruitmentSetting.route";
import { careersRoutes } from "./careers/careers.route";
import { authMiddleware } from "../../../middlewares/auth";
import { role } from "../../../utils/role";
import { recruitmentDashboardController } from "./dashboard/recruitmentDashboard.controller";

const router = express.Router();

// Public careers portal (no auth) — anonymous requests skip the subscription gateway.
router.use("/careers", careersRoutes);

// Overview dashboard
router.get("/dashboard", authMiddleware(role.company), recruitmentDashboardController.getDashboard);

// System setup / configuration resources
router.use("/job-types", jobTypeRoutes);
router.use("/candidate-sources", candidateSourceRoutes);
router.use("/interview-types", interviewTypeRoutes);
router.use("/job-locations", jobLocationRoutes);
router.use("/custom-questions", customQuestionRoutes);
router.use("/interview-rounds", interviewRoundRoutes);
router.use("/onboarding-checklists", onboardingChecklistRoutes);
router.use("/checklist-items", checklistItemRoutes);
router.use("/candidate-assessments", candidateAssessmentRoutes);
router.use("/interview-feedbacks", interviewFeedbackRoutes);

// Operational resources
router.use("/job-postings", jobPostingRoutes);
router.use("/candidates", candidateRoutes);
router.use("/interviews", interviewRoutes);
router.use("/offers", offerRoutes);
router.use("/candidate-onboardings", candidateOnboardingRoutes);

// Settings (dashboard moved to the unified /api/v1/dashboard hub)
router.use("/settings", recruitmentSettingRoutes);

export const recruitmentRoutes = router;
