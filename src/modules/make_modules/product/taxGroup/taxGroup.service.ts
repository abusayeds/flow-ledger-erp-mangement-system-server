import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";
import { TaxModel } from "../tax/tax.model";
import { TaxGroupModel } from "./taxGroup.model";
import {
  TAX_BASE_AMOUNTS,
  TAX_GROUP_STATUS,
  TTaxBaseAmount,
  TTaxGroup,
  TTaxGroupMember,
  TTaxGroupStatus,
} from "./taxGroup.interface";

const parseBaseAmount = (value: unknown): TTaxBaseAmount => {
  if (value === undefined || value === null || value === "") {
    return "net_amount";
  }
  const parsed = String(value).trim().toLowerCase();
  if (!TAX_BASE_AMOUNTS.includes(parsed as TTaxBaseAmount)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "base_amount must be net_amount or net_plus_tax_amount"
    );
  }
  return parsed as TTaxBaseAmount;
};

const parseStatus = (value: unknown): TTaxGroupStatus => {
  if (value === undefined || value === null || value === "") return "active";
  const parsed = String(value).trim().toLowerCase();
  if (!TAX_GROUP_STATUS.includes(parsed as TTaxGroupStatus)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "status must be active or archived"
    );
  }
  return parsed as TTaxGroupStatus;
};

/**
 * Normalises `members` and confirms every referenced tax belongs to this
 * company — otherwise a group could quietly point at another tenant's tax, or
 * at an id that no longer exists, and the computed rate would be wrong.
 */
const parseMembers = async (
  membersInput: unknown,
  user_id: string
): Promise<TTaxGroupMember[]> => {
  if (!Array.isArray(membersInput)) {
    throw new AppError(httpStatus.BAD_REQUEST, "members must be an array");
  }
  if (membersInput.length === 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "A tax group needs at least one tax"
    );
  }

  const members = membersInput.map((raw) => {
    const entry = (raw ?? {}) as Record<string, unknown>;
    const taxId = String(entry.tax_id ?? "").trim();
    if (!Types.ObjectId.isValid(taxId)) {
      throw new AppError(httpStatus.BAD_REQUEST, `Invalid tax_id: ${taxId}`);
    }
    return {
      tax_id: new Types.ObjectId(taxId),
      base_amount: parseBaseAmount(entry.base_amount),
    };
  });

  const ids = members.map((m) => m.tax_id);
  const found = await TaxModel.countDocuments({ _id: { $in: ids }, user_id });
  if (found !== new Set(ids.map(String)).size) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "One or more taxes in this group do not exist"
    );
  }
  return members;
};

const createTaxGroupDB = async (payload: TTaxGroup, user_id: string) => {
  if (!payload.name?.trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, "Tax group name is required");
  }
  const members = await parseMembers(payload.members, user_id);
  return await TaxGroupModel.create({
    ...payload,
    user_id,
    members,
    status: parseStatus(payload.status),
  });
};

const getAllTaxGroupDB = async (
  user_id: string,
  query: Record<string, unknown>
) => {
  const taxGroupQuery = new queryBuilder(
    TaxGroupModel.find({ user_id }).populate("members.tax_id", "name rate type"),
    query
  )
    .search(["name"])
    .filter()
    .sort()
    .fields();
  return taxGroupQuery.modelQuery.exec();
};

const getSingleTaxGroupDB = async (id: string, user_id: string) => {
  return await TaxGroupModel.findOne({ _id: id, user_id }).populate(
    "members.tax_id",
    "name rate type"
  );
};

const updateTaxGroupDB = async (
  id: string,
  payload: Partial<TTaxGroup>,
  user_id: string
) => {
  const update: Record<string, unknown> = { ...payload };
  // Never let a client re-assign ownership.
  delete update.user_id;

  if (payload.members !== undefined) {
    update.members = await parseMembers(payload.members, user_id);
  }
  if (payload.status !== undefined) {
    update.status = parseStatus(payload.status);
  }

  const result = await TaxGroupModel.findOneAndUpdate(
    { _id: id, user_id },
    update,
    { new: true, runValidators: true }
  );
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Tax group not found");
  }
  return result;
};

const deleteTaxGroupDBOne = async (id: string, user_id: string) => {
  return await TaxGroupModel.findOneAndDelete({ _id: id, user_id });
};

const deleteTaxGroupDB = withBulkDeleteId(deleteTaxGroupDBOne);

export const taxGroupService = {
  createTaxGroupDB,
  getAllTaxGroupDB,
  getSingleTaxGroupDB,
  updateTaxGroupDB,
  deleteTaxGroupDB,
};
