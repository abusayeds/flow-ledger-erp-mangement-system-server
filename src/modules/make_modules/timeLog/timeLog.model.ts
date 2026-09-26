import { Schema, model, Types } from "mongoose";

/** How the time was captured — mirrors the Manage Timesheet type selector. */
export const TIME_LOG_TYPES = ["clock_in_out", "project", "manual"] as const;
export type TTimeLogType = (typeof TIME_LOG_TYPES)[number];

export interface TTimeLog {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  creator_id?: Types.ObjectId;
  /** The employee the time is logged *for* (the creator is who entered it). */
  employee_id?: Types.ObjectId;
  employee_name?: string;
  type?: TTimeLogType;
  /** Minutes alongside [hours]; the timesheet form captures both. */
  minutes?: number;
  date?: Date;
  details?: string;
  // Project / task are free-text from the app form (users may type a name).
  project_id?: Types.ObjectId;
  project_name?: string;
  task_id?: Types.ObjectId;
  task_name?: string;
  notes?: string;
  hours?: number;
  is_active?: boolean;
  isDeleted?: boolean;
}

const timeLogSchema = new Schema<TTimeLog>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    creator_id: { type: Schema.Types.ObjectId, ref: "User" },
    // The employee the entry is for. Free text is allowed so a name can be
    // typed when it does not match an employee record.
    employee_id: { type: Schema.Types.ObjectId, ref: "User" },
    employee_name: { type: String },
    type: { type: String, enum: TIME_LOG_TYPES, default: "manual" },
    minutes: { type: Number, default: 0 },
    date: { type: Date },
    details: { type: String },
    project_id: { type: Schema.Types.ObjectId, ref: "Project" },
    project_name: { type: String },
    task_id: { type: Schema.Types.ObjectId },
    task_name: { type: String },
    notes: { type: String },
    hours: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const TimeLogModel = model<TTimeLog>("TimeLog", timeLogSchema);
