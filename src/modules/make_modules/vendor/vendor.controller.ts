import httpStatus from "http-status";
import { AuthRequest } from "../../../middlewares/auth";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { vendorService } from "./vendor.service";
import { ActivityAction } from "../activities/activities.interface";
import { Types } from "mongoose";
import { activitiesService } from "../activities/activities.service";
import { ActivityModule } from "../../../utils/activityModules";
import { activityActors } from "../../../utils/activityContext";
import { handleParamBulkDelete } from "../../../utils/bulkDeleteController";

const vendorCreate = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req?.user?._id;
  const result = await vendorService.vendorCreateDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "vendor successfully.",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.vendor,
    entity_ids: [(result._id as Types.ObjectId)],
    action: ActivityAction.created,
    title: `${result?.businessProfile?.companyName || result?.name} Vendor Created`,
  });
});

const allVendor = catchAsync(async (req: AuthRequest, res) => {
  const result = await vendorService.allVendorDB(req?.user?._id as string, req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All vendor get successfully.",
    pagination: result.pagination,
    data: result.allVendor
  });
});

const VendorReturnList = catchAsync(async (req: AuthRequest, res) => {
  const result = await vendorService.VendorReturnList(req?.user?._id as string, req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All vendor get successfully.",
    pagination: result.pagination,
    data: result.allVendor
  });
});

const singleVendor = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params
  const result = await vendorService.singleVendorDB(
    req?.user?._id as string,
    id,
    req.query as Record<string, unknown>
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Single vendor get successfully.",
    data: result
  });
});
const deleteVendor = catchAsync(async (req: AuthRequest, res) => {
  const { ids, data: result } = await handleParamBulkDelete(req.params.id, (id) =>
    vendorService.deleteVendorDB(req?.user?._id as string, {
      _id: new Types.ObjectId(id),
    }),
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Oparation successfull.",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.vendor,
    entity_ids: ids.map((id) => new Types.ObjectId(id)),
    action: ActivityAction.archived,
    title:
      ids.length === 1
        ? `${result?.businessProfile?.companyName || result?.name || "Vendor"} Archived`
        : `${ids.length} Vendors Archived`,
  });
});
const updateVendor = catchAsync(async (req: AuthRequest, res) => {
  const result = await vendorService.updateVendorDB(req?.user?._id as string, req.body);


  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Oparation successfull.",
    data: result
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.vendor,
    entity_ids: [(result._id as Types.ObjectId)],
    action: ActivityAction.updated,
    title: `${result?.businessProfile?.companyName || result?.name} Vendor Updated`,
  });
});
const mergeVendors = catchAsync(async (req: AuthRequest, res) => {
  const result = await vendorService.mergeVendorsDB(
    req?.user?._id as unknown as string,
    req.body.survivor_id,
    req.body.merged_ids,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Vendors merged successfully.",
    data: result,
  });
});

export const vendorController = {
  mergeVendors,
  vendorCreate,
  allVendor,
  VendorReturnList,
  singleVendor,
  deleteVendor,
  updateVendor
};
