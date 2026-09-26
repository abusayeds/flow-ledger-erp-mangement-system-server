import { permission } from "../../../../utils/permission";
import { createRecruitmentCrudService } from "../recruitment.crud.service";
import { InterviewFeedbackModel } from "./interviewFeedback.model";
import { TInterviewFeedback } from "./interviewFeedback.interface";

const P = permission.recruitment.interview_feedbacks;

const populate = [
  {
    path: "interview_id",
    select: "candidate_id job_id",
    populate: [
      { path: "candidate_id", select: "first_name last_name" },
      { path: "job_id", select: "title" },
    ],
  },
  { path: "interviewer_ids", select: "name" },
];

const interviewerNames = (refs: unknown): string[] => {
  if (!Array.isArray(refs)) return [];
  return refs
    .map((ref) => (ref && typeof ref === "object" && "name" in ref ? (ref as { name?: string }).name : null))
    .filter((name): name is string => Boolean(name));
};

const formatInterview = (ref: unknown) => {
  if (!ref || typeof ref !== "object" || !("_id" in ref)) {
    return { candidate: null, job_posting: null };
  }

  const interview = ref as {
    candidate_id?: { first_name?: string; last_name?: string } | null;
    job_id?: { title?: string } | null;
  };

  const candidate =
    interview.candidate_id && typeof interview.candidate_id === "object"
      ? {
          first_name: interview.candidate_id.first_name ?? null,
          last_name: interview.candidate_id.last_name ?? null,
        }
      : null;

  const jobPosting =
    interview.job_id && typeof interview.job_id === "object"
      ? { name: interview.job_id.title ?? null }
      : null;

  return { candidate, job_posting: jobPosting };
};

export const interviewFeedbackService = createRecruitmentCrudService<TInterviewFeedback>({
  model: InterviewFeedbackModel,
  label: "Interview feedback",
  perms: { manageAny: P.manage_any_interview_feedbacks, manageOwn: P.manage_own_interview_feedbacks },
  searchFields: ["strengths", "weaknesses", "comments"],
  populate,
  formatItem: (d) => ({
    _id: d._id,
    technical_rating: d.technical_rating ?? null,
    communication_rating: d.communication_rating ?? null,
    cultural_fit_rating: d.cultural_fit_rating ?? null,
    overall_rating: d.overall_rating ?? null,
    strengths: d.strengths ?? null,
    weaknesses: d.weaknesses ?? null,
    comments: d.comments ?? null,
    recommendation: d.recommendation,
    interview_id:
      d.interview_id && typeof d.interview_id === "object" && "_id" in d.interview_id
        ? d.interview_id._id
        : d.interview_id ?? null,
    interview: formatInterview(d.interview_id),
    interviewer_names: interviewerNames(d.interviewer_ids),
    createdAt: d.createdAt,
  }),
});
