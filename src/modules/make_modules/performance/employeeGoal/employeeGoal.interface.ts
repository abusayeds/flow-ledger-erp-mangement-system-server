import { Types } from "mongoose";

export type TEmployeeGoalStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "overdue";

export type TPerformanceEmployeeGoal = {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  creator_id?: Types.ObjectId;
  employee_id: Types.ObjectId;
  goal_type_id?: Types.ObjectId;
  title: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  target: string;
  progress: number;
  status: TEmployeeGoalStatus;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
