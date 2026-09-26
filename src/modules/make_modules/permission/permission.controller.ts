import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { permissionService } from "./permission.service";
import { AuthRequest } from "../../../middlewares/auth";
import { rolePermission } from "../../../utils/permissions";

const updatePermission = catchAsync(async (req: AuthRequest, res: Response) => {
  const companyId = req.user?._id;
  const result = await permissionService.updatePermissionDB(companyId as string, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Permission updated successfully",
    data: result,
  });
});

const createRole = catchAsync(async (req: AuthRequest, res: Response) => {
  const companyId = req.user?._id;
  const result = await permissionService.createRoleDB(companyId as string, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Role created successfully",
    data: result,
  });
});

const deleteRole = catchAsync(async (req: AuthRequest, res: Response) => {
  const companyId = req.user?._id;
  await permissionService.deleteRoleDB(companyId as string, req.params.role);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Role deleted successfully",
    data: null,
  });
});

const renameRole = catchAsync(async (req: AuthRequest, res: Response) => {
  const companyId = req.user?._id;
  const result = await permissionService.renameRoleDB(companyId as string, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Role renamed successfully",
    data: result,
  });
});

const updateUserPermission = catchAsync(async (req: AuthRequest, res: Response) => {
  const companyId = req.user?._id;
  const result = await permissionService.updateUserPermissionsDB(
    companyId as string,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User permissions updated successfully",
    data: result,
  });
});

const getPermissionsByCompany = catchAsync(async (req: AuthRequest, res: Response) => {
  const companyId = req.user?._id;
  const result = await permissionService.getPermissionsByCompanyDB(companyId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Permissions fetched successfully",
    data: result,
  });
});

const getAllPermissions = catchAsync(async (req: AuthRequest, res: Response) => {
  // const addOn = (req.query.addOn as string) || "general";
  // const result = rolePermission.filter((item) => item.addOn === addOn);

  // const addOn = (req.query.addOn as string) || "general";
  const result = rolePermission

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All permissions fetched successfully",
    data: result,
  });
});

const setRoleActive = catchAsync(async (req: AuthRequest, res: Response) => {
  const companyId = req.user?._id;
  const result = await permissionService.setRoleActiveDB(
    companyId as string,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result?.isActive
      ? "Role activated successfully"
      : "Role deactivated successfully",
    data: result,
  });
});

export const permissionController = {
  updatePermission,
  createRole,
  deleteRole,
  renameRole,
  updateUserPermission,
  getPermissionsByCompany,
  getAllPermissions,
  setRoleActive,
};
