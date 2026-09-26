import { AuthRequest } from "../../../../middlewares/auth";
import { companyScope, resolveCompanyId } from "../recruitment.utils";
import { CandidateModel } from "../candidate/candidate.model";
import { JobPostingModel } from "../jobPosting/jobPosting.model";
import { InterviewModel } from "../interview/interview.model";
import { CandidateOnboardingModel } from "../candidateOnboarding/candidateOnboarding.model";

const PALETTE = ["3B82F6", "10B981", "F59E0B", "8B5CF6", "EF4444", "06B6D4"];
const avatarUrl = (name: string, i: number) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "NA")}&background=${PALETTE[i % PALETTE.length]}&color=fff`;
const daysSince = (d: unknown) =>
  d ? Math.max(0, Math.round((Date.now() - new Date(d as string).getTime()) / 86400000)) : 0;

const getDashboard = async (req: AuthRequest) => {
  const companyId = resolveCompanyId(req);
  const scope = { ...companyScope(companyId), isDeleted: { $ne: true } };

  const [candidates, jobs, interviews, onboardings] = await Promise.all([
    CandidateModel.find(scope)
      .select("first_name last_name status current_position job_id application_date createdAt")
      .lean(),
    JobPostingModel.find(scope).select("title priority is_published createdAt").lean(),
    InterviewModel.find(scope)
      .populate("candidate_id", "first_name last_name")
      .populate("job_id", "title")
      .select("scheduled_date scheduled_time status candidate_id job_id")
      .lean(),
    CandidateOnboardingModel.find(scope).select("status").lean(),
  ]);

  const cand = candidates as any[];
  const countStatus = (s: string) => cand.filter((c) => c.status === s).length;
  const total = cand.length;

  // Candidate status overview.
  const statusOverview = [
    { name: "Applied", value: countStatus("New"), color: "#3B82F6" },
    { name: "Shortlisted", value: countStatus("Shortlisted"), color: "#10B981" },
    { name: "Interview", value: countStatus("Interview"), color: "#F59E0B" },
    { name: "Hired", value: countStatus("Hired"), color: "#8B5CF6" },
  ];

  // Hiring funnel.
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const shortlisted = countStatus("Shortlisted");
  const interviewed = countStatus("Interview");
  const hired = countStatus("Hired");
  const hiringFunnel = [
    { stage: "Applications", candidates: total, percentage: 100, color: "#3B82F6" },
    { stage: "Shortlisted", candidates: shortlisted, percentage: pct(shortlisted), color: "#10B981" },
    { stage: "Interviewed", candidates: interviewed, percentage: pct(interviewed), color: "#F59E0B" },
    { stage: "Hired", candidates: hired, percentage: pct(hired), color: "#8B5CF6" },
  ];

  // Onboarding progress.
  const onb = onboardings as any[];
  const onboardingProgress = [
    { name: "Completed", value: onb.filter((o) => o.status === "Completed").length, color: "#3B82F6" },
    { name: "In Progress", value: onb.filter((o) => o.status === "In Progress").length, color: "#10B981" },
    { name: "Pending", value: onb.filter((o) => o.status === "Pending").length, color: "#F59E0B" },
  ];

  // Upcoming interviews (scheduled, soonest first).
  const upcomingInterviews = (interviews as any[])
    .filter((iv) => iv.status === "Scheduled")
    .sort((a, b) => String(a.scheduled_date).localeCompare(String(b.scheduled_date)))
    .slice(0, 5)
    .map((iv, i) => {
      const c = iv.candidate_id;
      const name = c ? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() : "Candidate";
      return {
        candidate: name,
        position: iv.job_id?.title ?? "—",
        date: iv.scheduled_date ?? "",
        time: iv.scheduled_time ?? "",
        status: String(iv.status ?? "").toLowerCase(),
        avatar: avatarUrl(name, i),
      };
    });

  // Recent candidates (newest first).
  const recentCandidates = [...cand]
    .sort((a, b) => +new Date(b.createdAt || 0) - +new Date(a.createdAt || 0))
    .slice(0, 5)
    .map((c, i) => {
      const name = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim();
      return {
        name,
        position: c.current_position ?? "—",
        stage: c.status ?? "New",
        appliedDate: c.application_date
          ? String(c.application_date).slice(0, 10)
          : c.createdAt
            ? String(c.createdAt).slice(0, 10)
            : "",
        avatar: avatarUrl(name, i),
      };
    });

  // Open positions (published jobs) with live applicant counts.
  const applicantsByJob = new Map<string, number>();
  for (const c of cand) {
    if (c.job_id) applicantsByJob.set(String(c.job_id), (applicantsByJob.get(String(c.job_id)) || 0) + 1);
  }
  const openPositions = (jobs as any[])
    .filter((j) => j.is_published !== false)
    .slice(0, 8)
    .map((j) => ({
      title: j.title,
      department: "—",
      applicants: applicantsByJob.get(String(j._id)) || 0,
      daysOpen: daysSince(j.createdAt),
      priority: j.priority ?? "Low",
    }));

  const stats = {
    total_candidates: total,
    open_positions: jobs.filter((j: any) => j.is_published !== false).length,
    interviews: interviews.length,
    hired,
  };

  return {
    stats,
    statusOverview,
    hiringFunnel,
    onboardingProgress,
    upcomingInterviews,
    recentCandidates,
    openPositions,
  };
};

export const recruitmentDashboardService = { getDashboard };
