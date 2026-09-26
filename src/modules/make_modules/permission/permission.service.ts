import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../errors/AppError";
import { TPermission } from "./permission.interface";
import { PermissionModel } from "./permission.model";
import { role, BASE_ROLE_VALUES } from "../../../utils/role";
import { parseValidPermissions, normalizePermission } from "../../../utils/permissionCatalog";
import { UserModel } from "../../basic_modules/user/user.model";
import { resolveEffectivePermissions } from "../../../utils/userPermissions";

const ROLES_BLOCKED_FOR_USER_PERMISSION_UPDATE = new Set<string>([
  role.superadmin,
  role.company,

]);

// Names a company may not create/redefine (system-owned).
const RESERVED_ROLE_NAMES = new Set<string>([role.superadmin, role.company]);

/**
 * Shared guard for delete/rename: only a company-defined custom role with
 * zero currently-assigned users may be deleted or renamed. System roles
 * (superadmin/company/base roles) can never be deleted or renamed, and a
 * role still held by any user is locked until every user is moved off it.
 */
const assertRoleDeletableOrRenamable = async (companyId: string, roleName: string) => {
  if (RESERVED_ROLE_NAMES.has(roleName) || BASE_ROLE_VALUES.has(roleName)) {
    throw new AppError(httpStatus.BAD_REQUEST, "This role is a system role and cannot be deleted or renamed.");
  }
  const existing = await PermissionModel.findOne({ companyId, role: roleName });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Role not found.");
  }
  const userCount = await UserModel.countDocuments({ companyId, role: roleName, isDeleted: false });
  if (userCount > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `This role is assigned to ${userCount} user${userCount === 1 ? "" : "s"} and cannot be deleted or renamed. Reassign or remove those users first.`,
    );
  }
  return existing;
};

const deleteRoleDB = async (companyId: string, roleName: string) => {
  const name = String(roleName ?? "").trim();
  if (!name) {
    throw new AppError(httpStatus.BAD_REQUEST, "Role is required");
  }
  await assertRoleDeletableOrRenamable(companyId, name);
  await PermissionModel.deleteOne({ companyId, role: name });
};

const renameRoleDB = async (
  companyId: string,
  payload: { role?: string; newRole?: string; label?: string },
) => {
  const currentName = String(payload.role ?? "").trim();
  const nextName = String(payload.newRole ?? "").trim();
  if (!currentName || !nextName) {
    throw new AppError(httpStatus.BAD_REQUEST, "Both role and newRole are required");
  }
  const existing = await assertRoleDeletableOrRenamable(companyId, currentName);

  if (currentName !== nextName) {
    if (RESERVED_ROLE_NAMES.has(nextName) || BASE_ROLE_VALUES.has(nextName)) {
      throw new AppError(httpStatus.BAD_REQUEST, "This role name is reserved");
    }
    const conflict = await PermissionModel.findOne({ companyId, role: nextName });
    if (conflict) {
      throw new AppError(httpStatus.CONFLICT, "A role with this name already exists");
    }
  }

  existing.role = nextName;
  if (payload.label !== undefined) {
    existing.label = String(payload.label).trim();
  }
  await existing.save();
  return existing;
};

const updatePermissionDB = async (companyId: string, payload: Partial<TPermission>) => {
  const { role: prevRole, permissions: rawPermissions } = payload;
  if (!prevRole || !String(prevRole).trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, "Role is required");
  }
  const roleName = String(prevRole).trim();
  if (RESERVED_ROLE_NAMES.has(roleName)) {
    throw new AppError(httpStatus.BAD_REQUEST, "This role name is reserved");
  }
  if (rawPermissions === undefined || rawPermissions === null) {
    throw new AppError(httpStatus.BAD_REQUEST, "permissions is required");
  }
  const permissions = parseValidPermissions(rawPermissions);
  const result = await PermissionModel.findOneAndUpdate(
    { companyId, role: roleName },
    { permissions },
    { new: true, upsert: true, runValidators: true },

  );
  return result;
};

// Create a brand-new company-defined role (fails if it already exists).
const createRoleDB = async (companyId: string, payload: Partial<TPermission>) => {
  const { role: roleRaw, permissions: rawPermissions, label: labelRaw } = payload;
  if (!roleRaw || !String(roleRaw).trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, "Role is required");
  }
  const roleName = String(roleRaw).trim();
  if (RESERVED_ROLE_NAMES.has(roleName)) {
    throw new AppError(httpStatus.BAD_REQUEST, "This role name is reserved");
  }
  const existing = await PermissionModel.findOne({ companyId, role: roleName });
  if (existing) {
    throw new AppError(httpStatus.CONFLICT, "A role with this name already exists");
  }
  const permissions = parseValidPermissions(rawPermissions ?? []);
  const result = await PermissionModel.create({
    companyId,
    role: roleName,
    permissions,
    label: String(labelRaw ?? "").trim(),
  });
  return result;
};



const updateUserPermissionsDB = async (
  companyId: string,
  payload: { userId?: string; permissions?: unknown; resetToRole?: boolean },
) => {
  const { userId, permissions: rawPermissions, resetToRole } = payload;
  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Valid userId is required");
  }
  const user = await UserModel.findOne({
    _id: userId,
    companyId
  });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found under this company");
  }
  if (ROLES_BLOCKED_FOR_USER_PERMISSION_UPDATE.has(user.role)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot update permissions for superadmin or company users",
    );
  }

  if (resetToRole) {
    user.permissions = [];
    user.permissionsOverridden = false;
  } else {
    if (rawPermissions === undefined || rawPermissions === null) {
      throw new AppError(httpStatus.BAD_REQUEST, "permissions is required");
    }
    const rolePermissions = await PermissionModel.findOne({ companyId, role: user.role });
    const rolePermList = (rolePermissions?.permissions ?? []) as string[];
    const roleSet = new Set(rolePermList.map((p) => normalizePermission(String(p))));
    const sent = parseValidPermissions(rawPermissions);
    // Store only extras beyond the live role template (role base always applies at resolve time).
    const extras = sent.filter((p) => !roleSet.has(normalizePermission(String(p))));
    user.permissions = extras;
    user.permissionsOverridden = extras.length > 0;
  }

  await user.save();
  const result = user.toObject();
  delete result.password;
  delete result.permissionsOverridden;
  result.permissions = await resolveEffectivePermissions(user);
  return result;
};



const getPermissionsByCompanyDB = async (companyId: string) => {
  const result = await PermissionModel.find({ companyId });
  return result;
};


const getPermissionByRoleDB = async (companyId: string, roleName: string) => {
  const result = await PermissionModel.findOne({ companyId, role: roleName });
  return result;
};

/** Toggle whether a role is allowed to log in for this company. */
const setRoleActiveDB = async (
  companyId: string,
  payload: { role?: string; isActive?: boolean; label?: string },
) => {
  const roleName = String(payload.role ?? "").trim();
  if (!roleName) {
    throw new AppError(httpStatus.BAD_REQUEST, "Role is required");
  }
  if (RESERVED_ROLE_NAMES.has(roleName)) {
    throw new AppError(httpStatus.BAD_REQUEST, "This role name is reserved");
  }
  if (typeof payload.isActive !== "boolean") {
    throw new AppError(httpStatus.BAD_REQUEST, "isActive must be a boolean");
  }

  const update: Record<string, unknown> = { isActive: payload.isActive };
  if (payload.label !== undefined) {
    update.label = String(payload.label).trim();
  }

  const result = await PermissionModel.findOneAndUpdate(
    { companyId, role: roleName },
    { $set: update, $setOnInsert: { permissions: [] } },
    { new: true, upsert: true, runValidators: true },
  );
  return result;
};

export const permissionService = {
  updatePermissionDB,
  createRoleDB,
  deleteRoleDB,
  renameRoleDB,
  updateUserPermissionsDB,
  getPermissionsByCompanyDB,
  getPermissionByRoleDB,
  setRoleActiveDB,
};

