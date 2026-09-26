import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { AuthRequest } from "../../../middlewares/auth";
import { activitiesService } from "./activities.service";
import { TActivityModule } from "../../../utils/activityModules";

const getAllActivities = catchAsync(async (req: AuthRequest, res) => {
  const result = await activitiesService.getAllActivitiesDB(
    req.user?._id as string,
    req.query as Record<string, unknown>
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Activities retrieved successfully.",
    data: result.data,
    pagination: result.pagination,
  });
});

const getEntityActivities = catchAsync(async (req: AuthRequest, res) => {
  const { module, entityId } = req.params;
  const result = await activitiesService.getActivitiesByEntityDB(
    req.user?._id as string,
    module as TActivityModule,
    entityId,
    req.query as Record<string, unknown>
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Activities retrieved successfully.",
    data: result.data,
    pagination: result.pagination,
  });
});

export const activitiesController = {
  getAllActivities,
  getEntityActivities,
};
