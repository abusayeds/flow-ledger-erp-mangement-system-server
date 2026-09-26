import { Document, Types } from "mongoose";
import { TPermissions } from "../../basic_modules/user/user.interface";

export type TPermission = {
  companyId?: Types.ObjectId | null;
  role: string; // base enum role OR a company-defined custom role name
  permissions: TPermissions;
  /** When false, users with this role cannot log in for this company. */
  isActive?: boolean;
  /** Optional display label; falls back to capitalized role name. */
  label?: string;
} & Document;
