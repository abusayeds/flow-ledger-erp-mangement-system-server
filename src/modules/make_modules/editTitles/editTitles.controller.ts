import httpStatus from "http-status";
import { AuthRequest } from "../../../middlewares/auth";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { ActivityAction } from "../activities/activities.interface";
import { activitiesService } from "../activities/activities.service";
import { editTitleService } from "./editTitles.service";
import { ActivityModule } from "../../../utils/activityModules";
import { activityActors } from "../../../utils/activityContext";


const editTitlesUpdate = catchAsync(async (req: AuthRequest, res) => {
  const result = await editTitleService.updateEditTitleDB(req.body , req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Updated successfully.",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.edit_titles,
    entity_ids: [req.body._id],
    action: ActivityAction.updated,
    title: `Edit Title ${req.body.name} Updated`,
  });
});
const singleEditTitles= catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await editTitleService.getSingleEditTitleDB(id,);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Updated successfully.",
    data: result,
  });
});
const myEditTitles= catchAsync(async (req: AuthRequest, res) => {
  const result = await editTitleService.myEditTitleDB(req.user?._id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "successfully.",
    data: result,
  });
});


export const editTitleController = {
  editTitlesUpdate,
  singleEditTitles , 
  myEditTitles
};
