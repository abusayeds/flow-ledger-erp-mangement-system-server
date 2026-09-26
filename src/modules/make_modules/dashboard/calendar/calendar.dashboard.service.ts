/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuthRequest } from "../../../../middlewares/auth";
import { companyObjectId, resolveCompanyId } from "../dashboard.utils";
import { InvoiceModel } from "../../invoice/invoice.model";
import { InterviewModel } from "../../recruitment/interview/interview.model";
import { DealModel } from "../../crm/deal/deal.model";
import { LeadModel } from "../../crm/lead/lead.model";
import { ProjectModel } from "../../project/project.model";
import { HrmEventModel, HrmHolidayModel, HrmLeaveApplicationModel } from "../../hrm/models";

type CalendarEvent = { id: string; title: string; date: Date | string; type: string };

const isValidDate = (v: unknown): boolean =>
  !!v && !Number.isNaN(new Date(v as string).getTime());

// Each source is resolved independently so a single failing/empty collection
// never blanks the whole calendar.
const safe = async (fn: () => Promise<CalendarEvent[]>): Promise<CalendarEvent[]> => {
  try {
    return await fn();
  } catch {
    return [];
  }
};

const getEventCalendar = async (req: AuthRequest) => {
  const companyId = resolveCompanyId(req);
  const uid = companyObjectId(companyId);
  const scope = { user_id: uid };

  const sources = await Promise.all([
    // Sales invoices → due date.
    safe(async () =>
      (await InvoiceModel.find(scope).select("invoice_number due_date").lean())
        .filter((d: any) => isValidDate(d.due_date))
        .map((d: any) => ({
          id: String(d._id),
          title: d.invoice_number || "Invoice",
          date: d.due_date,
          type: "sales_invoice",
        })),
    ),
    // HRM events.
    safe(async () =>
      (await HrmEventModel.find({ ...scope, isDeleted: false }).select("title start_date").lean())
        .filter((d: any) => isValidDate(d.start_date))
        .map((d: any) => ({
          id: String(d._id),
          title: d.title || "Event",
          date: d.start_date,
          type: "event",
        })),
    ),
    // HRM holidays.
    safe(async () =>
      (await HrmHolidayModel.find({ ...scope, isDeleted: false }).select("name start_date").lean())
        .filter((d: any) => isValidDate(d.start_date))
        .map((d: any) => ({
          id: String(d._id),
          title: d.name || "Holiday",
          date: d.start_date,
          type: "holiday",
        })),
    ),
    // HRM approved leave.
    safe(async () =>
      (await HrmLeaveApplicationModel.find({ ...scope, isDeleted: false, status: "approved" })
        .select("reason start_date")
        .lean())
        .filter((d: any) => isValidDate(d.start_date))
        .map((d: any) => ({
          id: String(d._id),
          title: d.reason || "Leave",
          date: d.start_date,
          type: "leave",
        })),
    ),
    // Scheduled interviews.
    safe(async () =>
      (await InterviewModel.find({ ...scope, status: "Scheduled" })
        .populate("candidate_id", "first_name last_name")
        .populate("job_id", "title")
        .lean())
        .filter((d: any) => isValidDate(d.scheduled_date))
        .map((d: any) => ({
          id: String(d._id),
          title:
            (d.candidate_id
              ? `${d.candidate_id.first_name} ${d.candidate_id.last_name}`
              : "Interview") + (d.job_id?.title ? ` - ${d.job_id.title}` : ""),
          date: d.scheduled_date,
          type: "interview_schedule",
        })),
    ),
    // Project due dates.
    safe(async () =>
      (await ProjectModel.find({ ...scope, isDeleted: false }).select("name end_date").lean())
        .filter((d: any) => isValidDate(d.end_date))
        .map((d: any) => ({
          id: String(d._id),
          title: d.name || "Project",
          date: d.end_date,
          type: "project_due_task",
        })),
    ),
    // CRM deal tasks (embedded).
    safe(async () => {
      const deals = await DealModel.find({ ...scope, isDeleted: false })
        .select("name tasks")
        .lean();
      const out: CalendarEvent[] = [];
      for (const d of deals as any[]) {
        for (const t of d.tasks || []) {
          if (!isValidDate(t.date)) continue;
          out.push({
            id: `${d._id}-${t._id ?? t.name}`,
            title: t.name || d.name || "Deal Task",
            date: t.date,
            type: "deal_task",
          });
        }
      }
      return out;
    }),
    // CRM lead tasks (embedded).
    safe(async () => {
      const leads = await LeadModel.find({ ...scope, isDeleted: false })
        .select("name tasks")
        .lean();
      const out: CalendarEvent[] = [];
      for (const l of leads as any[]) {
        for (const t of l.tasks || []) {
          if (!isValidDate(t.date)) continue;
          out.push({
            id: `${l._id}-${t._id ?? t.name}`,
            title: t.name || l.name || "Lead Task",
            date: t.date,
            type: "lead_task",
          });
        }
      }
      return out;
    }),
  ]);

  return sources.flat();
};

export const calendarDashboardService = { getEventCalendar };
