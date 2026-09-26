import { Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import AppError from "../../../errors/AppError";
import sendResponse from "../../../utils/sendResponse";
import httpStatus from "http-status";
import { AuthRequest } from "../../../middlewares/auth";
import { TSettingType } from "./app.setting.interface";
import { Types } from "mongoose";
import { settingService } from "./app.setting.service";
import { activitiesService } from "../activities/activities.service";
import { ActivityAction } from "../activities/activities.interface";
import { ActivityModule } from "../../../utils/activityModules";
import { activityActors } from "../../../utils/activityContext";

//  GET Setting
const getSetting = catchAsync(async (req: AuthRequest, res: Response) => {
  const user= req.user
  const type = req.query.type as TSettingType | undefined;
  const subType = req.query.subType as string | undefined;
  const data = await settingService.getSettingService(user?._id as Types.ObjectId, type, subType);
  if (!data) {
    throw new AppError(404, "Setting not found");
  }
 console.log(data);
 
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Setting fetched successfully",
    data,
  });
});

//  LIST available types + subTypes
const getSettingTypes = catchAsync(async (_req: AuthRequest, res: Response) => {
  const data = settingService.getSettingTypesService();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Setting types fetched successfully",
    data,
  });
});

//  UPDATE Setting
const updateSetting = catchAsync(async (req: AuthRequest, res: Response) => {
  const user= req?.user
  const type = req.body.type as TSettingType;
  const subType = req.body.subType as string | undefined;
  if (!type) {
    throw new AppError(400, "'type' body is required");
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    throw new AppError(400, "Request body cannot be empty");
  }

  const data = await settingService.updateSettingService(user?._id as Types.ObjectId, type, req.body, subType);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Setting updated successfully",
    data,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.app_setting,
    entity_ids: [req.user!._id as Types.ObjectId],
    action: ActivityAction.updated,
    title: `Setting ${type}${subType ? `.${subType}` : ""} Updated`,
  });
});
//  RESET Setting to defaults (whole, by type, or by type+subType)
const resetSetting = catchAsync(async (req: AuthRequest, res: Response) => {
  const user = req?.user;
  const type = req.body.type as TSettingType | undefined;
  const subType = req.body.subType as string | undefined;

  const data = await settingService.resetSettingService(user?._id as Types.ObjectId, type, subType);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Setting reset to default successfully",
    data,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.app_setting,
    entity_ids: [req.user!._id as Types.ObjectId],
    action: ActivityAction.updated,
    title: `Setting ${type ?? "all"}${subType ? `.${subType}` : ""} Reset`,
  });
});

export const appSettingController = {
  getSetting,
  getSettingTypes,
  updateSetting,
  resetSetting,
};
