/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcrypt";

import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import queryBuilder from "../../../builder/queryBuilder";
import { JWT_SECRET_KEY, GOOGLE_CLIENT_ID } from "../../../config";
import AppError from "../../../errors/AppError";
import { sendEmail, sendRegistationOtpEmail, } from "./sendEmail";
import { IUser, } from "./user.interface";
import { OTPModel, UserModel } from "./user.model";
import { role, BASE_ROLE_VALUES } from "../../../utils/role";
import { Types } from "mongoose";
import { PermissionModel } from "../../make_modules/permission/permission.model";
import { TPermission } from "../../make_modules/permission/permission.interface";
import { resolveEffectivePermissions, loadStoredRolePermissions } from "../../../utils/userPermissions";
import {
  companyPartyListFilter,
  isCompanyPartyListRole,
} from "../../../utils/partyUser";

export const generateToken = (payload: any): string => {
  return jwt.sign(payload, JWT_SECRET_KEY as string, { expiresIn: "7d" });
};
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};
export const getStoredOTP = async (email: string): Promise<string | null> => {
  const otpRecord = await OTPModel.findOne({ email });
  return otpRecord ? otpRecord.otp : null;
};
export const generateOTP = (): string => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(otp);
  return otp
};
export const findUserByEmail = async (email: string): Promise<IUser | null> => {
  return UserModel.findOne({ email }).select('+password');
};

export const findUserById = async (id: string): Promise<IUser | null> => {
  return UserModel.findById(id);
};
export const saveOTP = async (email: string, otp: string): Promise<void> => {
  await OTPModel.findOneAndUpdate(
    { email },
    { otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    { upsert: true, new: true },
  );
};

const createUserDB = async (payload: IUser) => {
  const isUserRegistered = await UserModel.findOne({ email: payload.email });
  const { password, confirmPassword } = payload;
  if (isUserRegistered && isUserRegistered.isVerify === true) {
    throw new AppError(httpStatus.BAD_REQUEST, "You already have an account.");
  }
  if (password !== confirmPassword) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Passwords do not match');
  }
  if (!payload.role) {
    payload.role = role.company;
  }

  if (isUserRegistered && isUserRegistered.isVerify === false) {
    await UserModel.findOneAndUpdate(
      { email: payload.email },
      payload,
      { new: true, upsert: true }
    );
  } else if (!isUserRegistered) {
    await UserModel.create(payload);
  }
  const email = payload.email;
  const otp = generateOTP();
  await saveOTP(email, otp);
  await sendRegistationOtpEmail(otp, email);

  const token = jwt.sign({ email }, JWT_SECRET_KEY as string, { expiresIn: "7d" });

  return {
    token: token
  };
}

const verifyOtpDB = async (email: string) => {
  const user = await UserModel.findOne({ email: email })
  if (user.isVerify) {
    throw new AppError(httpStatus.BAD_REQUEST, "Alredy verified")
  }
  const result = await UserModel.findOneAndUpdate({ email: email, }, { isVerify: true }, { new: true, upsert: true, },)
  return {
    _id: result._id,
    email: result.email
  }
}

/**
 * Dynamic company/role validation for login (local + Google). Skipped for
 * superadmin/company (owner) accounts — they don't reference another company.
 * A role's validity is never hardcoded: any role not in BASE_ROLE_VALUES is
 * only valid while a matching Permission doc exists for that company.
 */
const assertCompanyAndRoleActive = async (user: IUser) => {
  if (user.role === role.superadmin || user.role === role.company) return;

  if (!user.companyId) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Your account is not linked to a company. Contact your administrator.",
    );
  }

  const company = await UserModel.findOne({
    _id: user.companyId,
    role: role.company,
    isDeleted: false,
  }).select("_id");
  if (!company) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Your company account no longer exists. Contact your administrator.",
    );
  }

  const rolePerm = await PermissionModel.findOne({
    companyId: user.companyId,
    role: user.role,
  }).select("isActive");

  if (!rolePerm && !BASE_ROLE_VALUES.has(user.role)) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Your role no longer exists in this company. Contact your administrator.",
    );
  }
  if (rolePerm && rolePerm.isActive === false) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "This role is inactive. Contact your administrator.",
    );
  }
};

const loginDB = async (email: string, password: string) => {
  const user = await UserModel.findOne({ email: email  , authProvider : "local" }).select('+password +permissionsOverridden');
  if (!user) {throw new AppError(httpStatus.NOT_FOUND,"This account does not exist.")}
  if (!user.login) {throw new AppError(httpStatus.UNAUTHORIZED,"You are not allowed to login.")}
  if (user.isDeleted) { throw new AppError(httpStatus.NOT_FOUND,"your account is deleted by admin.")}
  if (user.status === "blocked") { throw new AppError(httpStatus.UNAUTHORIZED,"Your account has been blocked. Contact your administrator.")}

  await assertCompanyAndRoleActive(user);

  const isPasswordValid = await bcrypt.compare(
    password,
    user.password as string,
  );

  if (!isPasswordValid) {
    throw new AppError(httpStatus.UNAUTHORIZED,
      "Wrong password!",
    );
  }
  const userSafe = { ...user.toObject ? user.toObject() : user };
  delete userSafe.password;
  delete userSafe.isVerify;
  delete userSafe.permissionsOverridden;
  userSafe.permissions = await resolveEffectivePermissions(user);

  return userSafe;
}
const googleOAuthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const googleLoginDB = async (payload: { credential?: string }) => {
  if (!payload.credential) {
    throw new AppError(httpStatus.BAD_REQUEST, "Google credential is required.");
  }

  // Verify the ID token server-side so we never trust a client-supplied email/name.
  const ticket = await googleOAuthClient.verifyIdToken({
    idToken: payload.credential,
    audience: GOOGLE_CLIENT_ID,
  });
  const googlePayload = ticket.getPayload();
  if (!googlePayload?.email) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid Google credential.");
  }
  const email = googlePayload.email;
  const name = googlePayload.name || email;
  const image = googlePayload.picture;

  let user = await UserModel.findOne({ email, authProvider: "google" }).select('+permissionsOverridden');

  if (!user) {
    user = await UserModel.create({
      name,
      email,
      image,
      authProvider: "google",
      role: role.company,
      isVerify: true,
      password: null,
    });
  }

  if (user.isDeleted) { throw new AppError(httpStatus.NOT_FOUND, "your account is deleted by admin.") }
  if (user.status === "blocked") { throw new AppError(httpStatus.UNAUTHORIZED, "Your account has been blocked. Contact your administrator.") }

  await assertCompanyAndRoleActive(user);

  const userSafe = { ...(user.toObject ? user.toObject() : user) };
  delete userSafe.password;
  delete userSafe.isVerify;
  delete userSafe.permissionsOverridden;
  userSafe.permissions = await resolveEffectivePermissions(user);

  return userSafe;
}

const forgotPasswordDB = async (email: string) => {
  const user = await UserModel.findOne({ email: email, isVerify: true  , authProvider : "local" });
  if (!user) {throw new AppError(httpStatus.NOT_FOUND,"This account does not exist.")}
  const otp = generateOTP();
  await saveOTP(email, otp);
  await sendEmail(otp, email)
}
const verifyForgotPasswordOtpDB = async (otp: string, email: string) => {
  const otpRecord = await OTPModel.findOne({ email });
  if (!otpRecord) {
    throw new AppError(httpStatus.NOT_FOUND,
      "User not found!",
    );
  }

  const currentTime = new Date();
  if (otpRecord.expiresAt < currentTime) {
    throw new AppError(httpStatus.BAD_REQUEST,
      "OTP has expired",
    );
  }

  if (otpRecord.otp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST,
      "Wrong OTP",
    );
  }

}

const resendOtpDB = async (email: string) => {

  const newOTP = generateOTP();
  await saveOTP(email, newOTP);
  await sendEmail(newOTP, email,);
}

const resetPasswordDB = async (payload: any, email: string) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND,
      "User not found.",
    );
  }
  if (payload.confirmPassword !== payload.password) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Passwords do not match');
  }
  await UserModel.findOneAndUpdate({ email: email }, payload, { new: true });
}

const changePasswordDB = async (payload: any, email: string) => {
  const { oldPassword, newPassword, confirmPassword } = payload
  if (!oldPassword || !newPassword || !confirmPassword) {
    throw new AppError(httpStatus.BAD_REQUEST,
      "Please provide oldPassword, newPassword, and confirmPassword.",
    );
  }
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND,
      "User not found.",
    );
  }
  const isMatch = await bcrypt.compare(oldPassword, user.password as string);
  if (!isMatch) {
    throw new AppError(httpStatus.BAD_REQUEST,
      "Old password is incorrect.",
    );
  }

  if (newPassword !== confirmPassword) {
    throw new AppError(httpStatus.BAD_REQUEST,
      "New password and confirm password do not match.",
    );
  }
  await UserModel.findOneAndUpdate({ email: email }, { password: newPassword }, { new: true });
}

const updateUserDB = async (payload: IUser, file: any, userId: string) => {

  const user = await findUserById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND,
      "User not found.",
    );
  }
  const updateData: any = {};
  if (file) {
    const imagePath = `public\\images\\${file.filename}`;
    const publicFileURL = `/images/${file.filename}`;
    updateData.image = {
      path: imagePath,
      publicFileURL: publicFileURL
    };
  }
  const result = await UserModel.findByIdAndUpdate(userId, { ...payload, ...updateData }, { new: true });
  const updateUser = { ...result.toObject ? result.toObject() : result };
  delete updateUser.password;
  delete updateUser.isVerify;

  return updateUser;
}

const myProfileDB = async (userId: string) => {
  const user = await UserModel.findById(userId).select('-password -isVerify +permissionsOverridden');
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND,
      "User not found.",
    );
  }
  const result = user.toObject();
  delete result.permissionsOverridden;
  // Return live role-derived permissions (per-user override wins) instead of the stored copy.
  result.permissions = await resolveEffectivePermissions(user);
  return result;
}
const allUserDB = async (query: Record<string, unknown>,) => {
  const userQuery = new queryBuilder(UserModel.find({ role: role.company , isDeleted: false }).select('-password -isVerify'), query).sort()
  const { totalData } = await userQuery.paginate(UserModel.find({ role: role.company , isDeleted: false }))
  const user = await userQuery.modelQuery.exec()
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query.limit) || 10;
  
  const pagination = userQuery.calculatePagination({
    totalData,
    currentPage,
    limit
  });
  return { pagination, user };
}

const createUserByCompanyDB = async (companyId: string, payload: IUser) => {
  const isUserRegistered = await UserModel.findOne({ email: payload.email });
  if (isUserRegistered) {
    throw new AppError(httpStatus.BAD_REQUEST, "User already exists");
  }
  // Invited team members may not carry a password (the invite form has no
  // password field). Generate a temporary one so the account can be created;
  // the user resets it via forgot-password.
  if (!payload.password) {
    payload.password = `${Math.random().toString(36).slice(-10)}A1!`;
  }
  if (!payload.role) {
    payload.role = role.staff;
  }
  const rolePermissions = await loadStoredRolePermissions(companyId, payload.role);
  payload.permissions = rolePermissions;
  payload.companyId = new Types.ObjectId(companyId);
  payload.isVerify = true;
  const result = await UserModel.create(payload);
  const userObject = result.toObject();
  delete userObject.password;
  
  return userObject;
};
const createCompanyBySuperadminDB = async (payload: IUser) => {
  const isUserRegistered = await UserModel.findOne({ email: payload.email });
  if (isUserRegistered) {
    throw new AppError(httpStatus.BAD_REQUEST, "User already exists");
  }
  payload.isVerify = true; 
  const result = await UserModel.create(payload);
  const userObject = result.toObject();
  delete userObject.password;
  
  return userObject;
};

const allUserForCompanyDB = async (companyId: string, query: Record<string, unknown>) => {
  const roleParam = typeof query.role === "string" ? query.role : undefined;
  const baseFilter = companyPartyListFilter(companyId, roleParam, query);
  const queryForBuilder = { ...query };
  if (isCompanyPartyListRole(roleParam)) {
    delete queryForBuilder.role;
  }

  const userQuery = new queryBuilder(
    UserModel.find(baseFilter).select("name email role companyId phone login image"),
    queryForBuilder,
    { softDelete: isCompanyPartyListRole(roleParam) ? false : undefined }
  )
    .search(["name", "email"])
    .filter()
    .fields()
    .sort();
  const { totalData } = await userQuery.paginate();
  const user = await userQuery.modelQuery.exec();
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query.limit) || 10;
  const pagination = userQuery.calculatePagination({
    totalData,
    currentPage,
    limit,
  });
  return { pagination, user };
};
const allRoleDB = async (companyId: string) => {

  const baseRoles = Object.values(role).filter(
    (singleRole) =>
      singleRole !== role.superadmin &&
      singleRole !== role.company
  );

  const users = await UserModel.find({
    isDeleted: false,
    companyId,
  }).select("name role email");

  // All permission docs for this company (base + custom roles).
  const permissionsData = await PermissionModel.find({ companyId });

  // Company-defined custom roles = permission-doc roles that aren't base/system.
  const reserved = new Set<string>([role.superadmin, role.company]);
  const customRoles = permissionsData
    .map((item) => item.role)
    .filter(
      (r) => r && !baseRoles.includes(r as any) && !reserved.has(r),
    );

  // Union, de-duplicated, base roles first then custom roles.
  const allRoleNames = Array.from(new Set<string>([...baseRoles, ...customRoles]));

  const prettyLabel = (name: string, stored?: string) => {
    if (stored && stored.trim()) return stored.trim();
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const result = allRoleNames.map((singleRole) => {

    const roleUsers = users.filter(
      (user) => user.role === singleRole
    );

    const permission = permissionsData.find(
      (item) => item.role === singleRole
    );

    const testUser = roleUsers.find((u) => Boolean(u.email));

    return {
      name: singleRole,

      label: prettyLabel(singleRole, permission?.label),

      permissions:
        permission?.permissions?.length || 0,

      isActive: permission?.isActive !== false,

      /** False for system roles (staff/hr/vendor/customer) — those can never be renamed/deleted. */
      isCustom: !BASE_ROLE_VALUES.has(singleRole),

      /** First user email for this role — handy for quick login testing. */
      testEmail: testUser?.email ?? "",

      users: roleUsers.map((user) => ({
        _id: user._id,
        name: user.name,
        email: user.email ?? "",
      })),
    };
  });
  return result;
};

/**
 * Public list of roles for the Login "Login as …" chips.
 * Mirrors company role names (base roles + any custom role that has at least
 * one user) and includes a sample email when a user exists.
 * Inactive roles for the default seed company are still listed but flagged.
 */
const loginPresetsDB = async () => {
  const DEMO_PASSWORD = "1qazxsw2";

  const systemRoles = [
    role.superadmin,
    role.company,
    role.hr,
    role.staff,
    role.vendor,
    role.customer,
  ];

  const users = await UserModel.find({
    isDeleted: false,
    role: { $in: systemRoles },
    email: { $exists: true, $ne: "" },
  })
    .select("name role email companyId")
    .lean();

  // Prefer a demo-looking email (`*@gmail.com`) when available.
  const pickEmail = (roleName: string) => {
    const forRole = users.filter((u) => u.role === roleName);
    const preferred =
      forRole.find((u) => String(u.email).endsWith("@gmail.com")) ??
      forRole[0];
    return preferred?.email || `${roleName}@gmail.com`;
  };

  const pretty = (name: string) => {
    if (name === role.superadmin) return "Super Admin";
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  return systemRoles.map((roleName) => ({
    role: roleName,
    label: pretty(roleName),
    email: pickEmail(roleName),
    password: DEMO_PASSWORD,
  }));
};

const rolePermissionsDB = async (companyId: string, roleName: string) => {
  const name = (roleName ?? "").trim();
  if (!name) {
    throw new AppError(httpStatus.BAD_REQUEST, "Role is required");
  }
  // Only the system-owned roles are off-limits; base + custom roles are allowed.
  if (name === role.superadmin || name === role.company) {
    throw new AppError(httpStatus.BAD_REQUEST, "This role name is reserved");
  }

  const permission = await PermissionModel.findOne({ companyId, role: name });

  return {
    name: name,
    label: name.charAt(0).toUpperCase() + name.slice(1),
    count: permission?.permissions?.length || 0,
    permissions: permission?.permissions ?? [],
  };
};

export const userService = {
  createUserDB,
  verifyOtpDB,
  loginDB,
  googleLoginDB ,
  forgotPasswordDB,
  verifyForgotPasswordOtpDB,
  resendOtpDB,
  resetPasswordDB,
  changePasswordDB,
  updateUserDB,
  myProfileDB,
  allUserDB,
  createUserByCompanyDB,
  createCompanyBySuperadminDB , 
  allRoleDB ,
  rolePermissionsDB ,
  allUserForCompanyDB,
  loginPresetsDB,
}


export const userDelete = async (id: string): Promise<void> => {
  await UserModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
};




