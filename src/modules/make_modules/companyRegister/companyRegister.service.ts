import { Types } from "mongoose";
import { CompanyRegisterModel } from "./companyRegister.model";
import { UserModel } from "../../basic_modules/user/user.model";

const uid = (id: string) => new Types.ObjectId(id);

const clearOtherOwners = async (userId: string, keepId?: Types.ObjectId | string) => {
  const filter: Record<string, unknown> = {
    user_id: uid(userId),
    isDeleted: { $ne: true },
    is_owner: true,
  };
  if (keepId) filter._id = { $ne: keepId };
  await CompanyRegisterModel.updateMany(filter, { $set: { is_owner: false } });
};

const createDB = async (userId: string, body: Record<string, unknown>) => {
  const existingCount = await CompanyRegisterModel.countDocuments({
    user_id: uid(userId),
    isDeleted: { $ne: true },
  });
  const wantOwner = body.is_owner === true || existingCount === 0;
  if (wantOwner) await clearOtherOwners(userId);
  const doc = await CompanyRegisterModel.create({
    ...body,
    user_id: uid(userId),
    is_owner: wantOwner,
  });
  return doc.toObject();
};

/**
 * List companies for the logged-in tenant.
 * Ensures there is always an Owner company — matching login email when possible,
 * otherwise the oldest record, otherwise auto-created from the user profile.
 */
const getAllDB = async (userId: string, query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = { user_id: uid(userId), isDeleted: { $ne: true } };
  const term = (query.searchTerm as string) ?? "";
  if (term.trim()) {
    const rx = new RegExp(term.trim(), "i");
    filter.$or = [{ business_name: rx }, { email: rx }, { reg_no: rx }, { vat: rx }];
  }

  let rows = await CompanyRegisterModel.find(filter).sort({ createdAt: -1 }).lean();

  const userDoc = (await UserModel.findById(userId)
    .select("name email image")
    .lean()) as { name?: string; email?: string; image?: string } | null;
  const userEmail = String(userDoc?.email || "").trim().toLowerCase();
  const userName = String(userDoc?.name || "").trim();
  const userLogo = String(userDoc?.image || "").trim();

  // Seed the owner's company register from the login account when empty.
  if (rows.length === 0) {
    const seeded = await CompanyRegisterModel.create({
      user_id: uid(userId),
      business_name: userName || userEmail || "My Company",
      email: userDoc?.email || "",
      logo: userLogo,
      is_owner: true,
    });
    rows = [seeded.toObject()];
    return rows;
  }

  // Ensure a register row exists for the login email so the owner can edit their own company.
  if (userEmail && !term.trim()) {
    const hasLoginRow = rows.some(
      (r) => String(r.email || "").trim().toLowerCase() === userEmail,
    );
    if (!hasLoginRow) {
      await clearOtherOwners(userId);
      const seeded = await CompanyRegisterModel.create({
        user_id: uid(userId),
        business_name: userName || userEmail || "My Company",
        email: userDoc?.email || "",
        logo: userLogo,
        is_owner: true,
      });
      rows = [seeded.toObject(), ...rows.map((r) => ({ ...r, is_owner: false }))];
      return rows;
    }
  }

  const hasOwner = rows.some((r) => r.is_owner);
  if (!hasOwner) {
    const emailMatch = userEmail
      ? rows.find((r) => String(r.email || "").trim().toLowerCase() === userEmail)
      : undefined;
    // Prefer email match; else oldest (last in -createdAt sort).
    const target = emailMatch || rows[rows.length - 1];
    await CompanyRegisterModel.updateOne({ _id: target._id }, { $set: { is_owner: true } });
    rows = rows.map((r) =>
      String(r._id) === String(target._id) ? { ...r, is_owner: true } : { ...r, is_owner: false },
    );
  }

  // If login email matches a company that isn't owner, promote it.
  if (userEmail) {
    const loginCompany = rows.find((r) => String(r.email || "").trim().toLowerCase() === userEmail);
    if (loginCompany && !loginCompany.is_owner) {
      await clearOtherOwners(userId, loginCompany._id);
      await CompanyRegisterModel.updateOne({ _id: loginCompany._id }, { $set: { is_owner: true } });
      rows = rows.map((r) => ({
        ...r,
        is_owner: String(r._id) === String(loginCompany._id),
      }));
    }
  }

  return rows;
};

const getSingleDB = async (userId: string, id: string) =>
  CompanyRegisterModel.findOne({ _id: id, user_id: uid(userId), isDeleted: { $ne: true } }).lean();

const updateDB = async (userId: string, id: string, body: Record<string, unknown>) => {
  const payload = { ...body };
  if (payload.is_owner === true) {
    await clearOtherOwners(userId, id);
  }
  // Never drop ownership from the only remaining company.
  if (payload.is_owner === false) {
    const owners = await CompanyRegisterModel.countDocuments({
      user_id: uid(userId),
      isDeleted: { $ne: true },
      is_owner: true,
      _id: { $ne: id },
    });
    if (owners === 0) payload.is_owner = true;
  }
  return CompanyRegisterModel.findOneAndUpdate(
    { _id: id, user_id: uid(userId), isDeleted: { $ne: true } },
    { $set: payload },
    { new: true },
  ).lean();
};

const deleteDB = async (userId: string, id: string) => {
  const existing = await CompanyRegisterModel.findOne({
    _id: id,
    user_id: uid(userId),
    isDeleted: { $ne: true },
  }).lean();
  if (!existing) return null;

  const deleted = await CompanyRegisterModel.findOneAndUpdate(
    { _id: id, user_id: uid(userId) },
    { $set: { isDeleted: true, is_owner: false } },
    { new: true },
  ).lean();

  if (existing.is_owner) {
    const next = await CompanyRegisterModel.findOne({
      user_id: uid(userId),
      isDeleted: { $ne: true },
    }).sort({ createdAt: 1 });
    if (next) {
      await CompanyRegisterModel.updateOne({ _id: next._id }, { $set: { is_owner: true } });
    }
  }
  return deleted;
};

export const companyRegisterService = { createDB, getAllDB, getSingleDB, updateDB, deleteDB };
