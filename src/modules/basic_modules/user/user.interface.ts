import { Document, Types } from "mongoose";
import { TPermissionKey } from "../../../utils/permission";
import { TRole } from "../../../utils/role";
import { TBusinessProfile } from "./user.business.interface";

export type IPendingUser = {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
  role: TRole;
} & Document;

export type TPermissions = TPermissionKey[];

export type IUser = {
  name?: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  designation?: string;
  language?: string;
  currency?: string;
  country?: string;
  website?: string;
  signature?: string | null;
  number_format?: string;
  decimal_separator?: string;
  payment_terms_sales?: string;
  payment_terms_purchase?: string;
  address?: string;
  image?: string;
  authProvider?: "local" | "google";
  role: TRole;
  companyId?: Types.ObjectId | null;
  created_by?: Types.ObjectId | null;
  businessProfile?: TBusinessProfile;
  permissions?: TPermissions;
  /** True when user has extra permissions beyond their role (merged at resolve time). */
  permissionsOverridden?: boolean;
  /** Runtime-only: live permissions resolved for authorization checks. Never persisted or serialized. */
  effectivePermissions?: TPermissions;
  isDeleted: boolean;
  isVerify: boolean;
  login: boolean;
  /** Set by superadmin BlockUser; undefined behaves as "active". */
  status?: "active" | "blocked";
  /** True once a company has consumed its one-time plan trial. */
  is_trial_done?: boolean;
} & Document;

export type IOTP = {
  email: string;
  otp: string;
  expiresAt: Date;
} & Document;
