import { IUser, TPermissions } from "../modules/basic_modules/user/user.interface";
import { PermissionModel } from "../modules/make_modules/permission/permission.model";
import { normalizePermission } from "./permissionCatalog";
import { TPermissionKey } from "./permission";
import { role } from "./role";
import { Types } from "mongoose";

/**
 * Live permissions for authorization.
 * - Role permissions always come from Permission collection (updates apply to all users instantly).
 * - Per-user extras (permissionsOverridden) are merged on top — role base is never removed.
 * - Company/superadmin keep their own stored permissions (superadmin bypasses checks anyway).
 */
const mergePermissions = (base: TPermissions, extras: TPermissions): TPermissions => {
  const seen = new Set<string>();
  const merged: TPermissionKey[] = [];
  for (const perm of [...base, ...extras]) {
    const key = normalizePermission(String(perm));
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(key as TPermissionKey);
  }
  return merged;
};

export const resolveEffectivePermissions = async (user: IUser): Promise<TPermissions> => {
  if (user.role === role.superadmin || user.role === role.company) {
    return (user.permissions ?? []) as TPermissions;
  }
  const rolePerm = await PermissionModel.findOne({
    companyId: user.companyId,
    role: user.role,
  }).select("permissions");
  const rolePermissions = (rolePerm?.permissions ?? []) as TPermissions;
  if (user.permissionsOverridden && (user.permissions?.length ?? 0) > 0) {
    return mergePermissions(rolePermissions, (user.permissions ?? []) as TPermissions);
  }
  return rolePermissions;
};

/** Permissions copied onto new users at create (same as create-user-by-company). */
export const loadStoredRolePermissions = async (
  companyId: Types.ObjectId | string | null | undefined,
  roleName: string
): Promise<TPermissions> => {
  const rolePerm = await PermissionModel.findOne({
    companyId,
    role: roleName,
  }).select("permissions");
  return (rolePerm?.permissions ?? []) as TPermissions;
};

export const hasUserPermission = (user: IUser, permission: TPermissionKey): boolean => {
  if (user.role === role.superadmin) return true;
  const key = normalizePermission(permission);
  // effectivePermissions is resolved per-request in auth; fall back to stored for any other caller.
  const list = user.effectivePermissions ?? user.permissions;
  return Array.isArray(list) && list.some((p) => normalizePermission(String(p)) === key);
};

/** User needs at least one of the listed permissions. */
export const hasAnyUserPermission = (
  user: IUser,
  permissions: TPermissionKey[],
): boolean =>
  permissions.some((p) => hasUserPermission(user, p));

/** Permissions from the list the user does not have (superadmin → none missing). */
export const getMissingPermissions = (
  user: IUser,
  permissions: TPermissionKey[],
): TPermissionKey[] => {
  if (user.role === role.superadmin) return [];
  return permissions.filter((p) => !hasUserPermission(user, p));
};

/** Permissions from the list the user satisfies. */
export const getGrantedPermissions = (
  user: IUser,
  permissions: TPermissionKey[],
): TPermissionKey[] => permissions.filter((p) => hasUserPermission(user, p));
