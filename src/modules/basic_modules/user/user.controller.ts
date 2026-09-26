import { role } from "./../../../utils/role";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import { JWT_SECRET_KEY } from "../../../config";
import AppError from "../../../errors/AppError";
import { tokenDecoded } from "../../../middlewares/decoded";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { UserModel } from "./user.model";
import {
  findUserById,
  generateToken,
  getStoredOTP,
  userDelete,
  userService,
} from "./user.service";
import { AuthRequest } from "../../../middlewares/auth";
import { syncCompanySeeds } from "../../../utils/seed";
import { handleParamBulkDelete } from "../../../utils/bulkDeleteController";
import { permissions } from "../../../utils/permissions";
const registerUser = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError(httpStatus.BAD_REQUEST, "email is required.");
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please provide a valid email address.",
    );
  }
  const result = await userService.createUserDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Verify OTP to register.",
    data: result,
  });
});
const verifyOTP = catchAsync(async (req: Request, res: Response) => {
  const { otp } = req.body;
  const { decoded }: any = await tokenDecoded(req, res);
  const email = decoded.email;
  const storedOTP = await getStoredOTP(email);
  if (!storedOTP || storedOTP !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid or expired OTP");
  }
  const result = await userService.verifyOtpDB(email);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Registration successful.",
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await userService.loginDB(email, password);
  const tokenUser =  {
    _id :  user._id , 
    name :  user.name , 
    email :  user.email ,  
    role : user.role 
  }
  const token = generateToken({ user: tokenUser });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Login complete!",
    data: {
      user,
      token,
    },
  });
  if (
    user.role === role.company ||
    user.role === role.customer ||
    user.role === "client" ||
    user.role === role.hr ||
    user.role === role.vendor ||
    user.role === role.staff
  ) {
    await syncCompanySeeds(user._id);
  }
    await UserModel.findByIdAndUpdate(user._id, { login : true });
});
const googleLogin = catchAsync(async (req: Request, res: Response) => {
  if (!req.body.authProvider || req.body.authProvider !== "google") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid authentication provider.",
    );
  }
  const user = await userService.googleLoginDB(req.body);
  const token = generateToken({ user: user });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Login complete!",
    data: { user, token },
  });
  await syncCompanySeeds(user._id);
});
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError(httpStatus.BAD_REQUEST, "Please provide an email.");
  }
  await userService.forgotPasswordDB(email);
  const token = jwt.sign(
    { email, forgot: "forgot" },
    JWT_SECRET_KEY as string,
    { expiresIn: "7d" },
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP sent to your email. Please check!",
    data: {
      token: token,
    },
  });
});

const verifyForgotPasswordOTP = catchAsync(
  async (req: Request, res: Response) => {
    const { otp } = req.body;
    if (!otp) {
      throw new AppError(httpStatus.BAD_REQUEST, "otp is required");
    }
    const { decoded }: any = await tokenDecoded(req, res);
    const email = decoded.email;
    const forgot = decoded.forgot;
    if (forgot !== "forgot") {
      throw new AppError(httpStatus.BAD_REQUEST, "invalid token");
    }
    const token = jwt.sign(
      { email, verifyForgot: "verifyForgot" },
      JWT_SECRET_KEY as string,
      { expiresIn: "7d" },
    );
    if (!email) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Please provide a valid email address.",
      );
    }
    await userService.verifyForgotPasswordOtpDB(otp, email);
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "OTP verified successfully.",
      data: {
        token: token,
      },
    });
  },
);
const resendOTP = catchAsync(async (req: Request, res: Response) => {
  const { decoded }: any = await tokenDecoded(req, res);
  const email = decoded.email;
  const token = jwt.sign(
    { email, forgot: "forgot" },
    JWT_SECRET_KEY as string,
    { expiresIn: "7d" },
  );
  if (!email) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please provide a valid email address.",
    );
  }
  await userService.resendOtpDB(email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "A new OTP has been sent to your email.",
    data: { token },
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { decoded }: any = await tokenDecoded(req, res);
  const verifyForgot = decoded.verifyForgot;
  if (verifyForgot !== "verifyForgot") {
    throw new AppError(httpStatus.BAD_REQUEST, "invalid token");
  }
  const email = decoded.email;
  if (!email) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please provide a valid email address.",
    );
  }
  await userService.resetPasswordDB(req.body, email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully.",
    data: null,
  });
});
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { decoded }: any = await tokenDecoded(req, res);
  const email = decoded.user.email;
  await userService.changePasswordDB(req.body, email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "You have successfully changed the password.",
    data: null,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { decoded }: any = await tokenDecoded(req, res);
  const userId = decoded.user._id;
  const result = await userService.updateUserDB(req.body, req.file, userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated.",
    data: result,
  });
});

const myProfile = catchAsync(async (req: AuthRequest, res) => {
  const result = await userService.myProfileDB(req.user?._id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "profile information retrieved successfully",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.allUserDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User list retrieved successfully",
    pagination: result.pagination,
    data: result.user,
  });
});

const createUserByCompany = catchAsync(async (req: AuthRequest, res: Response) => {
  const companyId = req.user?._id;
  const result = await userService.createUserByCompanyDB(companyId as string, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User created successfully with role permissions.",
    data: result,
  });
});
const createCompanyBySuperadmin = catchAsync(async (req: AuthRequest, res: Response) => {
  req.body.permissions = permissions;
  const result = await userService.createCompanyBySuperadminDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User created successfully Company Created.",
    data: result,
  });
});

const allUserForCompany = catchAsync(async (req: AuthRequest, res: Response) => {
  const companyId = req.user?._id;
  const result = await userService.allUserForCompanyDB(companyId as string , req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User list retrieved successfully",
    pagination: result.pagination,
    data: result.user,
  });
});

const allRole = catchAsync(async (req: AuthRequest, res: Response) => {
  const companyId = req.user?._id;
  const result = await userService.allRoleDB(companyId as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Role list retrieved successfully",
    data: result,
  });
});


const rolePermissions = catchAsync(async (req: AuthRequest, res: Response) => {
  const companyId = req.user?._id;
  const { role: roleName } = req.params;
  const result = await userService.rolePermissionsDB(companyId as string, roleName);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Role permissions retrieved successfully",
    data: result,
  });
});

const loginPresets = catchAsync(async (_req: Request, res: Response) => {
  const result = await userService.loginPresetsDB();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Login presets retrieved successfully",
    data: result,
  });
});

export const userController = {
  registerUser,
  loginUser,
  googleLogin,
  forgotPassword,
  verifyForgotPasswordOTP,
  resendOTP,
  resetPassword,
  changePassword,
  updateUser,
  myProfile,
  getAllUsers,
  verifyOTP,
  createUserByCompany ,
  createCompanyBySuperadmin , 
  allUserForCompany ,
  allRole ,
  rolePermissions,
  loginPresets,
};

export const BlockUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { decoded }: any = await tokenDecoded(req, res);
  const adminId = decoded.user?._id;
  const requestingUser = await UserModel.findById(adminId);
  if (!requestingUser || requestingUser.role !== role.superadmin) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Unauthorized: Only admins can change user status.",
    );
  }
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  if (user.role === role.superadmin) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Cannot change status of an admin user.",
    );
  }
  user.status = user.status === "active" ? "blocked" : "active";
  await user.save();

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User status changed to ${user.status} successfully.`,
    data: null,
    pagination: undefined,
  });
});

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  await handleParamBulkDelete(req.params?.id as string, async (id) => {
    const user = await findUserById(id);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "user not found .");
    }
    if (user.isDeleted) {
      throw new AppError(httpStatus.NOT_FOUND, "user  is already deleted.");
    }
    await userDelete(id);
    return null;
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "user deleted successfully",
    data: null,
  });
});
