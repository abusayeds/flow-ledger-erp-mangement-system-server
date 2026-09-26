import httpStatus from "http-status";
import { AuthRequest } from "../../../middlewares/auth";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { pdfSettingService } from "./pdf.setting.service";
import { ActivityAction } from "../activities/activities.interface";
import { activitiesService } from "../activities/activities.service";
import { ActivityModule } from "../../../utils/activityModules";
import { activityActors } from "../../../utils/activityContext";
import { Types } from "mongoose";


const PdfSettingUpdate = catchAsync(async (req: AuthRequest, res) => {
  const { pdfType } = req.params;
  const result = await pdfSettingService.PdfSettingUpdateDB(pdfType, req.body, req?.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "PDF setting updated successfully.",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.pdf_setting,
    entity_ids: [result!._id as Types.ObjectId],
    action: ActivityAction.updated,
    title: `PDF Setting ${pdfType} Updated`,
  });
});



const PdfSettingGet = catchAsync(async (req: AuthRequest, res) => {
  const { pdfType } = req.params;
  const result = await pdfSettingService.PdfSettingGetDB(pdfType, req?.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "PDF setting retrieved successfully.",
    data: result,
  });
});

const PdfSettingReset = catchAsync(async (req: AuthRequest, res) => {
  const { pdfType } = req.params;
  const result = await pdfSettingService.PdfSettingResetDB(pdfType, req?.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "PDF setting reset to default successfully.",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.pdf_setting,
    entity_ids: [result!._id as Types.ObjectId],
    action: ActivityAction.updated,
    title: `PDF Setting ${pdfType} Reset`,
  });
});

export const pdfSettingController = {
  PdfSettingUpdate,
  PdfSettingGet,
  PdfSettingReset,
};
