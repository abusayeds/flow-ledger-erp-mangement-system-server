import { Schema, model, Types, Document } from "mongoose";
import { THrmBase } from "../shared/hrm.types";
import { hrmBaseSchemaFields } from "./base.schema";

type Doc<T> = T & THrmBase & Document;

export type THrmAttendance = Doc<{
  employee_id: Types.ObjectId;
  shift_id?: Types.ObjectId;
  date: Date;
  clock_in: Date;
  clock_out?: Date;
  break_hour?: number;
  total_hour?: number;
  overtime_hours?: number;
  overtime_amount?: number;
  status: "present" | "half day" | "absent" | "on leave" | "off day" | "pending";
  notes?: string;
}>;

const attendanceSchema = new Schema({
  ...hrmBaseSchemaFields,
  employee_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  // Optional: the attendance grid records clock in/out per employee/day without
  // a shift picker. When omitted, createManual defaults it to the employee's shift.
  shift_id: { type: Schema.Types.ObjectId, ref: "HrmShift" },
  date: { type: Date, required: true },
  // Optional for non-work statuses (on leave / off day / absent).
  clock_in: Date,
  clock_out: Date,
  break_hour: { type: Number, default: 0 },
  total_hour: { type: Number, default: 0 },
  overtime_hours: { type: Number, default: 0 },
  overtime_amount: { type: Number, default: 0 },
  // "pending" kept for legacy rows only — UI no longer offers it.
  status: {
    type: String,
    enum: ["present", "half day", "absent", "on leave", "off day", "pending"],
    default: "present",
  },
  notes: String,
}, { timestamps: true });
attendanceSchema.index({ employee_id: 1, date: 1, user_id: 1 }, { unique: true });
export const HrmAttendanceModel = model<THrmAttendance>("HrmAttendance", attendanceSchema, "hrmattendances");

export type THrmLeaveApplication = Doc<{
  employee_id: Types.ObjectId;
  leave_type_id?: Types.ObjectId;
  start_date?: Date;
  end_date?: Date;
  total_days?: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  attachment?: string;
  approver_comment?: string;
  approved_by?: Types.ObjectId;
  approved_at?: Date;
}>;

export const HrmLeaveApplicationModel = model<THrmLeaveApplication>(
  "HrmLeaveApplication",
  new Schema({
    ...hrmBaseSchemaFields,
    employee_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    leave_type_id: { type: Schema.Types.ObjectId, ref: "HrmLeaveType" },
    start_date: Date,
    end_date: Date,
    total_days: Number,
    reason: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    attachment: String,
    approver_comment: String,
    approved_by: { type: Schema.Types.ObjectId, ref: "User" },
    approved_at: Date,
  }, { timestamps: true }),
  "hrmleaveapplications"
);

export type THrmHoliday = Doc<{
  name: string;
  start_date: Date;
  end_date: Date;
  holiday_type_id?: Types.ObjectId;
  description?: string;
  is_paid: boolean;
  is_sync_google_calendar: boolean;
  is_sync_outlook_calendar: boolean;
}>;

export const HrmHolidayModel = model<THrmHoliday>("HrmHoliday", new Schema({
  ...hrmBaseSchemaFields,
  name: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  holiday_type_id: { type: Schema.Types.ObjectId, ref: "HrmHolidayType" },
  description: String,
  is_paid: { type: Boolean, default: true },
  is_sync_google_calendar: { type: Boolean, default: false },
  is_sync_outlook_calendar: { type: Boolean, default: false },
}, { timestamps: true }), "hrmholidays");

export type THrmAward = Doc<{
  employee_id: Types.ObjectId;
  award_type_id: Types.ObjectId;
  award_date: Date;
  description?: string;
  certificate?: string;
  /** @deprecated use certificate */
  gift?: string;
  /** @deprecated use award_date */
  date?: Date;
}>;
export const HrmAwardModel = model<THrmAward>("HrmAward", new Schema({
  ...hrmBaseSchemaFields,
  employee_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  award_type_id: { type: Schema.Types.ObjectId, ref: "HrmAwardType", required: true },
  award_date: { type: Date, required: true },
  description: String,
  certificate: String,
  gift: String,
  date: Date,
}, { timestamps: true }), "hrmawards");

export type THrmPromotion = Doc<{
  employee_id: Types.ObjectId;
  previous_branch_id?: Types.ObjectId;
  previous_department_id?: Types.ObjectId;
  previous_designation_id?: Types.ObjectId;
  current_branch_id?: Types.ObjectId;
  current_department_id?: Types.ObjectId;
  current_designation_id?: Types.ObjectId;
  effective_date: Date;
  reason?: string;
  document?: string;
  status: "pending" | "approved" | "rejected";
  approved_by?: Types.ObjectId;
}>;
export const HrmPromotionModel = model<THrmPromotion>("HrmPromotion", new Schema({
  ...hrmBaseSchemaFields, employee_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  previous_branch_id: { type: Schema.Types.ObjectId, ref: "HrmBranch" },
  previous_department_id: { type: Schema.Types.ObjectId, ref: "HrmDepartment" },
  previous_designation_id: { type: Schema.Types.ObjectId, ref: "HrmDesignation" },
  current_branch_id: { type: Schema.Types.ObjectId, ref: "HrmBranch" },
  current_department_id: { type: Schema.Types.ObjectId, ref: "HrmDepartment" },
  current_designation_id: { type: Schema.Types.ObjectId, ref: "HrmDesignation" },
  effective_date: { type: Date, required: true },
  reason: String,
  document: String,
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  approved_by: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true }), "hrmpromotions");

export type THrmResignation = Doc<{
  employee_id: Types.ObjectId;
  last_working_date: Date;
  reason: string;
  description?: string;
  document?: string;
  status: "pending" | "accepted" | "rejected";
  approved_by?: Types.ObjectId;
}>;
export const HrmResignationModel = model<THrmResignation>("HrmResignation", new Schema({
  ...hrmBaseSchemaFields,
  employee_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  last_working_date: { type: Date, required: true },
  reason: { type: String, required: true },
  description: String,
  document: String,
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  approved_by: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true }), "hrmresignations");

export type THrmTermination = Doc<{
  employee_id: Types.ObjectId;
  termination_type_id?: Types.ObjectId;
  notice_date?: Date;
  termination_date?: Date;
  reason: string;
  description?: string;
  document?: string;
  status: "pending" | "approved" | "rejected";
  approved_by?: Types.ObjectId;
}>;
export const HrmTerminationModel = model<THrmTermination>("HrmTermination", new Schema({
  ...hrmBaseSchemaFields, employee_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  termination_type_id: { type: Schema.Types.ObjectId, ref: "HrmTerminationType" },
  notice_date: Date, termination_date: Date, reason: { type: String, required: true }, description: String, document: String,
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  approved_by: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true }), "hrmterminations");

export type THrmWarning = Doc<{
  employee_id: Types.ObjectId;
  warning_by?: Types.ObjectId;
  warning_type_id?: Types.ObjectId;
  subject: string;
  severity: string;
  warning_date?: Date;
  description?: string;
  document?: string;
  status: "pending" | "approved" | "rejected";
  employee_response?: string;
}>;
export const HrmWarningModel = model<THrmWarning>("HrmWarning", new Schema({
  ...hrmBaseSchemaFields, employee_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  warning_by: { type: Schema.Types.ObjectId, ref: "User" },
  warning_type_id: { type: Schema.Types.ObjectId, ref: "HrmWarningType" },
  subject: { type: String, required: true }, severity: { type: String, required: true },
  warning_date: Date, description: String, document: String,
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  employee_response: String,
}, { timestamps: true }), "hrmwarnings");

export type THrmComplaint = Doc<{
  employee_id: Types.ObjectId;
  against_employee_id?: Types.ObjectId;
  complaint_type_id?: Types.ObjectId;
  subject: string;
  description: string;
  complaint_date: Date;
  status: "pending" | "in review" | "assigned" | "in progress" | "resolved";
  document?: string;
  resolved_by?: Types.ObjectId;
  resolution_date?: Date;
}>;
export const HrmComplaintModel = model<THrmComplaint>("HrmComplaint", new Schema({
  ...hrmBaseSchemaFields, employee_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  against_employee_id: { type: Schema.Types.ObjectId, ref: "User" },
  complaint_type_id: { type: Schema.Types.ObjectId, ref: "HrmComplaintType" },
  subject: { type: String, required: true }, description: { type: String, required: true },
  complaint_date: { type: Date, required: true },
  status: { type: String, enum: ["pending", "in review", "assigned", "in progress", "resolved"], default: "pending" },
  document: String, resolved_by: { type: Schema.Types.ObjectId, ref: "User" }, resolution_date: Date,
}, { timestamps: true }), "hrmcomplaints");

export type THrmEmployeeTransfer = Doc<{
  employee_id: Types.ObjectId;
  from_branch_id?: Types.ObjectId;
  from_department_id?: Types.ObjectId;
  from_designation_id?: Types.ObjectId;
  to_branch_id?: Types.ObjectId;
  to_department_id?: Types.ObjectId;
  to_designation_id?: Types.ObjectId;
  transfer_date?: Date;
  effective_date: Date;
  reason: string;
  status: "pending" | "approved" | "in progress" | "rejected" | "cancelled";
  document?: string;
  approved_by?: Types.ObjectId;
}>;
export const HrmEmployeeTransferModel = model<THrmEmployeeTransfer>("HrmEmployeeTransfer", new Schema({
  ...hrmBaseSchemaFields, employee_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  from_branch_id: { type: Schema.Types.ObjectId, ref: "HrmBranch" },
  from_department_id: { type: Schema.Types.ObjectId, ref: "HrmDepartment" },
  from_designation_id: { type: Schema.Types.ObjectId, ref: "HrmDesignation" },
  to_branch_id: { type: Schema.Types.ObjectId, ref: "HrmBranch" },
  to_department_id: { type: Schema.Types.ObjectId, ref: "HrmDepartment" },
  to_designation_id: { type: Schema.Types.ObjectId, ref: "HrmDesignation" },
  transfer_date: Date,
  effective_date: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "in progress", "rejected", "cancelled"], default: "pending" },
  document: String, approved_by: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true }), "hrmemployeetransfers");

export type THrmEvent = Doc<{
  title: string;
  event_type_id?: Types.ObjectId;
  start_date?: Date;
  end_date?: Date;
  start_time?: string;
  end_time?: string;
  location?: string;
  status: "pending" | "approved" | "reject";
  description?: string;
  color?: string;
  approved_by?: Types.ObjectId;
  department_ids?: Types.ObjectId[];
}>;
export const HrmEventModel = model<THrmEvent>("HrmEvent", new Schema({
  ...hrmBaseSchemaFields, title: { type: String, required: true },
  event_type_id: { type: Schema.Types.ObjectId, ref: "HrmEventType" },
  start_date: Date, end_date: Date, start_time: String, end_time: String, location: String,
  status: { type: String, enum: ["pending", "approved", "reject"], default: "pending" },
  description: String, color: String, approved_by: { type: Schema.Types.ObjectId, ref: "User" },
  department_ids: [{ type: Schema.Types.ObjectId, ref: "HrmDepartment" }],
}, { timestamps: true }), "hrmevents");

export type THrmAnnouncement = Doc<{
  title: string;
  announcement_category_id?: Types.ObjectId;
  start_date?: Date;
  end_date?: Date;
  priority?: string;
  status: "active" | "inactive" | "draft";
  description?: string;
  approved_by?: Types.ObjectId;
  department_ids?: Types.ObjectId[];
}>;
export const HrmAnnouncementModel = model<THrmAnnouncement>("HrmAnnouncement", new Schema({
  ...hrmBaseSchemaFields, title: { type: String, required: true },
  announcement_category_id: { type: Schema.Types.ObjectId, ref: "HrmAnnouncementCategory" },
  start_date: Date, end_date: Date, priority: String,
  status: { type: String, enum: ["active", "inactive", "draft"], default: "draft" },
  description: String, approved_by: { type: Schema.Types.ObjectId, ref: "User" },
  department_ids: [{ type: Schema.Types.ObjectId, ref: "HrmDepartment" }],
}, { timestamps: true }), "hrmannouncements");

export type THrmDocument = Doc<{
  title: string;
  description?: string;
  document_category_id?: Types.ObjectId;
  document?: string;
  effective_date?: Date;
  status: "pending" | "approve" | "reject";
  uploaded_by?: Types.ObjectId;
  approved_by?: Types.ObjectId;
}>;
export const HrmDocumentModel = model<THrmDocument>("HrmDocument", new Schema({
  ...hrmBaseSchemaFields, title: { type: String, required: true }, description: String,
  document_category_id: { type: Schema.Types.ObjectId, ref: "HrmDocumentCategory" },
  document: String, effective_date: Date,
  status: { type: String, enum: ["pending", "approve", "reject"], default: "pending" },
  uploaded_by: { type: Schema.Types.ObjectId, ref: "User" },
  approved_by: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true }), "hrmdocuments");

export type THrmAcknowledgment = Doc<{
  employee_id: Types.ObjectId;
  document_id?: Types.ObjectId;
  status: "pending" | "acknowledged";
  acknowledgment_note?: string;
  acknowledged_at?: Date;
  assigned_by?: Types.ObjectId;
}>;
export const HrmAcknowledgmentModel = model<THrmAcknowledgment>("HrmAcknowledgment", new Schema({
  ...hrmBaseSchemaFields, employee_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  document_id: { type: Schema.Types.ObjectId, ref: "HrmDocument" },
  status: { type: String, enum: ["pending", "acknowledged"], default: "pending" },
  acknowledgment_note: String, acknowledged_at: Date,
  assigned_by: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true }), "hrmacknowledgments");
