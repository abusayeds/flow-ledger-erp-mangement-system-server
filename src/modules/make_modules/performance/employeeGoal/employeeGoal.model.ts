import { Schema, model } from "mongoose";
import { TPerformanceEmployeeGoal } from "./employeeGoal.interface";
import { performanceBaseFields } from "../performance.utils";

const employeeGoalSchema = new Schema<TPerformanceEmployeeGoal>(
  {
    ...performanceBaseFields,
    employee_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    goal_type_id: { type: Schema.Types.ObjectId, ref: "PerformanceGoalType", index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    target: { type: String, required: true },
    progress: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed", "overdue"],
      default: "not_started",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Laravel: getProgressPercentageAttribute => min(100, progress / target * 100)
employeeGoalSchema.virtual("progress_percentage").get(function () {
  const self = this as unknown as TPerformanceEmployeeGoal;
  const target = Number(self.target);
  if (!target || Number.isNaN(target)) return 0;
  return Math.min(100, (Number(self.progress || 0) / target) * 100);
});

export const PerformanceEmployeeGoalModel = model<TPerformanceEmployeeGoal>(
  "PerformanceEmployeeGoal",
  employeeGoalSchema
);
