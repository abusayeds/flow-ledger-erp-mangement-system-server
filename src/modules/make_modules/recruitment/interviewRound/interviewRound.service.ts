import { Types } from "mongoose";
import { AuthRequest } from "../../../../middlewares/auth";
import { permission } from "../../../../utils/permission";
import { createRecruitmentCrudService } from "../recruitment.crud.service";
import { assertCompanyRef, refName, resolveCompanyId } from "../recruitment.utils";
import { JobPostingModel } from "../jobPosting/jobPosting.model";
import { InterviewRoundModel } from "./interviewRound.model";
import { TInterviewRound } from "./interviewRound.interface";

const P = permission.recruitment.interview_rounds;

const populate = { path: "job_id", select: "title posting_code status" };

const formatJobId = (ref: unknown) => {
  if (ref && typeof ref === "object" && ref !== null && "_id" in ref) {
    const job = ref as {
      _id: Types.ObjectId;
      title?: string;
      posting_code?: string;
      status?: string;
    };
    return {
      _id: job._id,
      title: job.title ?? null,
      posting_code: job.posting_code ?? null,
      status: job.status ?? null,
    };
  }
  return ref ?? null;
};

const assertJob = async (body: Record<string, unknown>, req: AuthRequest) => {
  await assertCompanyRef(JobPostingModel, body.job_id, resolveCompanyId(req), "Job posting");
  return body;
};

export const interviewRoundService = createRecruitmentCrudService<TInterviewRound>({
  model: InterviewRoundModel,
  label: "Interview round",
  perms: { manageAny: P.manage_any_interview_rounds, manageOwn: P.manage_own_interview_rounds },
  searchFields: ["name", "description"],
  populate,
  beforeCreate: assertJob,
  beforeUpdate: assertJob,
  formatItem: (d) => ({
    _id: d._id,
    name: d.name,
    sequence_number: d.sequence_number ?? null,
    description: d.description ?? null,
    status: d.status,
    job_id: formatJobId(d.job_id),
    // Laravel Inertia list uses job_posting.title
    job_posting: refName(d.job_id, "title"),
    createdAt: d.createdAt,
  }),
});
