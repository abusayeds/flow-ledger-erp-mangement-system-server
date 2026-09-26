/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuthRequest } from "../../../../middlewares/auth";
import { CandidateModel } from "../../recruitment/candidate/candidate.model";
import { JobPostingModel } from "../../recruitment/jobPosting/jobPosting.model";
import { InterviewModel } from "../../recruitment/interview/interview.model";
import { CandidateOnboardingModel } from "../../recruitment/candidateOnboarding/candidateOnboarding.model";
import { CandidateAssessmentModel } from "../../recruitment/candidateAssessment/candidateAssessment.model";
import { InterviewFeedbackModel } from "../../recruitment/interviewFeedback/interviewFeedback.model";
import { RecruitmentSettingModel } from "../../recruitment/recruitmentSetting/recruitmentSetting.model";
import {
  actorRole,
  companyObjectId,
  companyScope,
  resolveActorUserId,
  resolveCompanyId,
  ROLE,
} from "../dashboard.utils";

const DEFAULT_WELCOME_CARD = {
  card_title: "Recruitment Hub",
  card_description:
    "Manage your talent pipeline efficiently. Streamline hiring process from job posting to onboarding.",
  button_text: "Copy Portal Link",
  button_icon: "Copy",
};

const getWelcomeCard = async (companyId: string) => {
  const setting = await RecruitmentSettingModel.findOne({
    user_id: companyObjectId(companyId),
    key: "dashboard_welcome_card",
  }).lean();
  if (!setting?.value) return DEFAULT_WELCOME_CARD;
  return typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
};

const mapInterviewEvent = (i: any) => ({
  id: i._id,
  title:
    `${i.candidate_id ? `${i.candidate_id.first_name} ${i.candidate_id.last_name}` : "Interview"}` +
    `${i.job_id?.title ? ` - ${i.job_id.title}` : ""}`,
  date: i.scheduled_date,
  time: i.scheduled_time || "09:00",
  status: i.status || "Scheduled",
});


const companyDashboard = async (companyId: string) => {
  const scope = companyScope(companyId);

  const [
    totalCandidates,
    activeJobPostings,
    pendingInterviews,
    completedOnboardings,
    applied,
    shortlisted,
    interviewScheduled,
    hired,
    rejected,
    onbPending,
    onbInProgress,
    onbCompleted,
  ] = await Promise.all([
    CandidateModel.countDocuments(scope),
    JobPostingModel.countDocuments({ ...scope, is_published: true }),
    InterviewModel.countDocuments({ ...scope, status: "Scheduled" }),
    CandidateOnboardingModel.countDocuments({ ...scope, status: "Completed" }),
    CandidateModel.countDocuments({ ...scope, status: "New" }),
    CandidateModel.countDocuments({ ...scope, status: "Shortlisted" }),
    CandidateModel.countDocuments({ ...scope, status: "Interview" }),
    CandidateModel.countDocuments({ ...scope, status: "Hired" }),
    CandidateModel.countDocuments({ ...scope, status: "Rejected" }),
    CandidateOnboardingModel.countDocuments({ ...scope, status: "Pending" }),
    CandidateOnboardingModel.countDocuments({ ...scope, status: "In Progress" }),
    CandidateOnboardingModel.countDocuments({ ...scope, status: "Completed" }),
  ]);

  const candidatesByStatus = { applied, shortlisted, interviewScheduled, hired, rejected };

  const calendarEvents = (
    await InterviewModel.find({ ...scope, status: "Scheduled" })
      .populate("candidate_id", "first_name last_name")
      .populate("job_id", "title")
      .lean()
  ).map(mapInterviewEvent);

  const [intPending, intCompleted, intCancelled] = await Promise.all([
    InterviewModel.countDocuments({ ...scope, status: "Scheduled" }),
    InterviewModel.countDocuments({ ...scope, status: "Completed" }),
    InterviewModel.countDocuments({ ...scope, status: "Cancelled" }),
  ]);

  const latestCandidates = (
    await CandidateModel.find(scope)
      .populate("job_id", "title")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
  ).map((c: any) => ({
    name: `${c.first_name} ${c.last_name}`,
    position: c.job_id?.title || c.current_position || "N/A",
    status: c.status || "New",
    date: c.application_date || c.createdAt,
  }));

  const upcomingInterviews = (
    await InterviewModel.find({ ...scope, status: "Scheduled" })
      .populate("candidate_id", "first_name last_name current_position")
      .populate("job_id", "title")
      .sort({ scheduled_date: 1 })
      .limit(5)
      .lean()
  ).map((i: any) => ({
    candidate_name: i.candidate_id
      ? `${i.candidate_id.first_name} ${i.candidate_id.last_name}`
      : "Unknown",
    role: i.job_id?.title || i.candidate_id?.current_position || "Interview",
    scheduled_date: i.scheduled_date,
    scheduled_time: i.scheduled_time || "09:00",
  }));

  const jobPostings = await Promise.all(
    (
      await JobPostingModel.find({ ...scope, is_published: true })
        .populate("job_type_id", "name title")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    ).map(async (j: any) => ({
      title: j.title,
      department: j.job_type_id?.name || j.job_type_id?.title || "General",
      applicants: await CandidateModel.countDocuments({ ...scope, job_id: j._id }),
      daysOpen: Math.max(
        0,
        Math.floor((Date.now() - new Date(j.createdAt).getTime()) / 86400000),
      ),
      priority: j.priority || "Low",
    })),
  );

  const hiringFunnel = {
    applications: applied + shortlisted + interviewScheduled + hired + rejected,
    shortlisted,
    interviewed: interviewScheduled,
    hired,
  };

  return {
    overview: {
      totalCandidates,
      activeJobPostings,
      pendingInterviews,
      completedOnboardings,
    },
    candidatesByStatus,
    interviewStatus: { pending: intPending, completed: intCompleted, cancelled: intCancelled },
    onboardingStatus: { pending: onbPending, inProgress: onbInProgress, completed: onbCompleted },
    hiringFunnel,
    calendarEvents,
    recentActivities: { latestCandidates, upcomingInterviews },
    jobPostings,
    alerts: { overdueInterviews: 0, pendingReviews: 0, incompleteOnboardings: 0, expiringJobs: 0 },
    welcomeCard: await getWelcomeCard(companyId),
  };
};

/* ------------------------------ STAFF ------------------------------ */
const staffDashboard = async (companyId: string, userId: string) => {
  const scope = companyScope(companyId);
  const uid = companyObjectId(userId);

  // Interviews the user is assigned to (interviewer) or created.
  const [assignedInterviews, createdInterviews] = await Promise.all([
    InterviewModel.find({ ...scope, interviewer_ids: uid }).select("_id").lean(),
    InterviewModel.find({ ...scope, creator_id: uid }).select("_id").lean(),
  ]);
  const interviewIdSet = new Set<string>();
  [...assignedInterviews, ...createdInterviews].forEach((i: any) => interviewIdSet.add(String(i._id)));
  const allInterviewIds = [...interviewIdSet];

  const assignedOnboardings = (
    await CandidateOnboardingModel.find({
      ...scope,
      $or: [{ creator_id: uid }, { buddy_employee_id: uid }],
    })
      .select("_id")
      .lean()
  ).map((o: any) => o._id);

  const [
    pendingInterviews,
    completedInterviews,
    completedOnboardings,
    pendingOnboardings,
    conductedAssessmentsCount,
    submittedFeedbacks,
  ] = await Promise.all([
    InterviewModel.countDocuments({ _id: { $in: allInterviewIds }, status: "Scheduled" }),
    InterviewModel.countDocuments({ _id: { $in: allInterviewIds }, status: "Completed" }),
    CandidateOnboardingModel.countDocuments({ _id: { $in: assignedOnboardings }, status: "Completed" }),
    CandidateOnboardingModel.countDocuments({ _id: { $in: assignedOnboardings }, status: "Pending" }),
    CandidateAssessmentModel.countDocuments({ ...scope, conducted_by: uid }),
    InterviewFeedbackModel.countDocuments({
      ...scope,
      $or: [{ creator_id: uid }, { interviewer_ids: uid }],
    }),
  ]);

  const calendarEvents = (
    await InterviewModel.find({ _id: { $in: allInterviewIds }, status: "Scheduled" })
      .populate("candidate_id", "first_name last_name")
      .populate("job_id", "title")
      .lean()
  ).map(mapInterviewEvent);

  const recentInterviews = (
    await InterviewModel.find({ _id: { $in: allInterviewIds } })
      .populate("candidate_id", "first_name last_name")
      .populate("job_id", "title")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
  ).map((i: any) => ({
    id: i._id,
    candidate_name: i.candidate_id
      ? `${i.candidate_id.first_name} ${i.candidate_id.last_name}`
      : "Unknown",
    job_title: i.job_id?.title || "Unknown Job",
    scheduled_date: i.scheduled_date,
    status: i.status,
  }));

  const recentOnboardings = (
    await CandidateOnboardingModel.find({ _id: { $in: assignedOnboardings } })
      .populate("candidate_id", "first_name last_name")
      .populate("checklist_id", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
  ).map((o: any) => ({
    id: o._id,
    candidate_name: o.candidate_id
      ? `${o.candidate_id.first_name} ${o.candidate_id.last_name}`
      : "Unknown",
    checklist_name: o.checklist_id?.name || "Unknown Checklist",
    start_date: o.start_date,
    status: o.status,
  }));

  const pendingFeedbacks = await InterviewModel.countDocuments({
    _id: { $in: allInterviewIds },
    feedback_submitted: false,
  });
  const upcomingInterviews = await InterviewModel.countDocuments({
    _id: { $in: allInterviewIds },
    status: "Scheduled",
  });

  return {
    overview: {
      assignedInterviews: allInterviewIds.length,
      pendingInterviews,
      assignedOnboardings: assignedOnboardings.length,
      completedOnboardings,
      conductedAssessments: conductedAssessmentsCount,
      submittedFeedbacks,
    },
    taskStatus: {
      pendingInterviews,
      completedInterviews,
      pendingOnboardings,
      completedOnboardings,
    },
    calendarEvents,
    recentActivities: { recentInterviews, recentOnboardings },
    alerts: { overdueInterviews: 0, pendingFeedbacks, upcomingInterviews },
  };
};

const getDashboard = async (req: AuthRequest) => {
  const companyId = resolveCompanyId(req);
  const type = actorRole(req);

  if (type === ROLE.company || type === ROLE.hr || type === ROLE.superadmin) {
    return companyDashboard(companyId);
  }
  return staffDashboard(companyId, resolveActorUserId(req));
};

export const recruitmentDashboardService = { getDashboard };
