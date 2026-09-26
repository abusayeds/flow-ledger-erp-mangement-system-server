import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import type { WorkflowResourceKey } from "../workflow/workflow.validation";

export const assertEnumValue = (
  value: unknown,
  allowed: readonly string[],
  field = "status",
): string => {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new AppError(httpStatus.BAD_REQUEST, `${field} is required`);
  }
  const normalized = String(value).trim();
  if (!allowed.includes(normalized)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Invalid ${field}. Allowed values: ${allowed.join(", ")}`,
    );
  }
  return normalized;
};

export const WORKFLOW_STATUS: Record<WorkflowResourceKey, readonly string[]> = {
  holidays: [],
  awards: [],
  promotions: ["pending", "approved", "rejected"],
  resignations: ["pending", "accepted", "rejected"],
  terminations: ["pending", "approved", "rejected"],
  warnings: ["pending", "approved", "rejected"],
  complaints: ["pending", "in review", "assigned", "in progress", "resolved"],
  "employee-transfers": ["pending", "approved", "in progress", "rejected", "cancelled"],
  events: ["pending", "approved", "reject"],
  announcements: ["active", "inactive", "draft"],
  documents: ["pending", "approve", "reject"],
  acknowledgments: ["pending", "acknowledged"],
};

export const validateWorkflowStatus = (resource: WorkflowResourceKey, status: unknown) =>
  assertEnumValue(status, WORKFLOW_STATUS[resource], "status");

export const LEAVE_APPLICATION_STATUS = ["pending", "approved", "rejected"] as const;
export const ATTENDANCE_STATUS = [
  "present",
  "half day",
  "absent",
  "on leave",
  "off day",
] as const;
export const PAYROLL_STATUS = ["draft", "processing", "completed", "cancelled"] as const;
export const PAYROLL_ENTRY_STATUS = ["paid", "unpaid"] as const;
export const LOAN_STATUS = ["active", "expired"] as const;

/** Resources that must use PUT /:id/status (or resignation path param), not generic PUT. */
const STATUS_VIA_DEDICATED_ENDPOINT: readonly WorkflowResourceKey[] = [
  "promotions",
  "resignations",
  "terminations",
  "complaints",
  "employee-transfers",
  "events",
  "announcements",
  "documents",
  "acknowledgments",
];

/** Validate or remove status on create/update (e.g. warnings allow status on PUT). */
export const applyWorkflowStatusOnWrite = (
  resource: WorkflowResourceKey,
  body: Record<string, unknown>,
) => {
  if (body.status === undefined) return;
  const allowed = WORKFLOW_STATUS[resource];
  if (!allowed.length) {
    delete body.status;
    return;
  }
  if (STATUS_VIA_DEDICATED_ENDPOINT.includes(resource)) {
    delete body.status;
    return;
  }
  body.status = assertEnumValue(body.status, allowed, "status");
};
