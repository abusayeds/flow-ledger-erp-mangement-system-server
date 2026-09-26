import { FilterQuery, Types } from "mongoose";
import { IUser } from "../../../basic_modules/user/user.interface";
import { AuthRequest } from "../../../../middlewares/auth";
import { role } from "../../../../utils/role";
import {
  OwnershipFilter,
  applyOwnershipToQuery,
  companyObjectId,
  companyScope,
  creatorObjectId,
  hasPermission,
  resolveActorUserId,
  resolveCompanyId,
  resolveOwnership,
} from "../../hrm/shared/hrm.utils";

export {
  applyOwnershipToQuery,
  companyObjectId,
  companyScope,
  creatorObjectId,
  resolveCompanyId,
  resolveActorUserId,
  resolveOwnership,
};
export type { OwnershipFilter };

export const sharesCompanySupportAdminAccess = (user: IUser) =>
  user.role === role.company || user.role === role.superadmin;

/** Laravel manage-any vs manage-own for tickets (ticket_user_id | creator_id). */
export const resolveSupportOwnership = (
  req: AuthRequest,
  manageAnyPerm: Parameters<typeof resolveOwnership>[1],
  manageOwnPerm: Parameters<typeof resolveOwnership>[2],
): OwnershipFilter => {
  const user = req.user!;
  const actorId = companyObjectId(resolveActorUserId(req));
  if (sharesCompanySupportAdminAccess(user)) {
    return { canManageAny: true, canManageOwn: true, actorId };
  }
  return {
    canManageAny: hasPermission(user, manageAnyPerm),
    canManageOwn: hasPermission(user, manageOwnPerm),
    actorId,
  };
};

export const applyTicketOwnershipToQuery = <T extends { ticket_user_id?: Types.ObjectId; creator_id?: Types.ObjectId }>(
  base: FilterQuery<T>,
  ownership: OwnershipFilter,
): FilterQuery<T> => {
  if (ownership.canManageAny) return base;
  if (!ownership.canManageOwn) {
    return { ...base, _id: { $exists: false } } as FilterQuery<T>;
  }
  return {
    ...base,
    $or: [{ ticket_user_id: ownership.actorId }, { creator_id: ownership.actorId }],
  } as FilterQuery<T>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const refLabel = (ref: any, labelKey = "name"): { _id: string; name: string } | null => {
  if (ref && typeof ref === "object" && labelKey in ref) {
    return { _id: String(ref._id), name: String(ref[labelKey] ?? "") };
  }
  return null;
};
