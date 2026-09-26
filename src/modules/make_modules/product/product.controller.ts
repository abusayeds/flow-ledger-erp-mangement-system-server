import httpStatus from "http-status";
import { AuthRequest } from "../../../middlewares/auth";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { productService } from "./product.service";
import { TProduct } from "./product.interface";
import { ActivityAction } from "../activities/activities.interface";
import { activitiesService } from "../activities/activities.service";
import { ActivityModule } from "../../../utils/activityModules";
import { activityActors } from "../../../utils/activityContext";
import { bulkDeleteResponseData, parseDeleteIdsFromParam } from "../../../utils/bulkDelete";

const productCreate = catchAsync(async (req: AuthRequest, res) => {
  req.body.user_id = req?.user?._id;
  const result : TProduct = await productService.productCreateDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product created successfully.",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.product,
    entity_ids: [result._id],
    action: ActivityAction.created,
    title: `${result.productName} Product Created`,
  });
});
const allProduct= catchAsync(async (req: AuthRequest, res) => {
  const result = await productService.allProductDB(req.user?._id as string, req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All products retrieved successfully.",
    data: result.allProduct,
    pagination: result.pagination
  });
});
const singleProduct= catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await productService.singleProductDB(req.user?._id as string, id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Single product retrieved successfully.",
    data: result
  });
});
const deleteProduct = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const ids = parseDeleteIdsFromParam(id);
  const result: TProduct | null = await productService.deleteProductDB(
    req.user?._id as string,
    id,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product deleted successfully.",
    data: bulkDeleteResponseData(ids, result),
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.product,
    entity_ids: ids.map((entry) => result?._id ?? entry),
    action: ActivityAction.archived,
    title:
      ids.length === 1
        ? `${result?.productName ?? "Product"} Deleted`
        : `${ids.length} Products Deleted`,
  });
});

const restoreProduct = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const ids = parseDeleteIdsFromParam(id);
  const result: TProduct | null = await productService.restoreProductDB(
    req.user?._id as string,
    id,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product restored successfully.",
    data: bulkDeleteResponseData(ids, result),
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.product,
    entity_ids: ids.map((entry) => result?._id ?? entry),
    action: ActivityAction.updated,
    title:
      ids.length === 1
        ? `${result?.productName ?? "Product"} Restored`
        : `${ids.length} Products Restored`,
  });
});

const updateProduct = catchAsync(async (req: AuthRequest, res) => {
  const { id } = req.params;
  req.body.user_id = req?.user?._id;
  const result : TProduct | null = await productService.updateProductDB(req.user?._id as string, id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product updated successfully.",
    data: result
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.product,
    entity_ids: [result?._id ?? id],
    action: ActivityAction.updated,
    title: `${result?.productName ?? "Product"} Updated`,
  });
});

const mergeProducts = catchAsync(async (req: AuthRequest, res) => {
  const result = await productService.mergeProductsDB(
    req.user?._id as string,
    req.body.survivor_id,
    req.body.merged_ids,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Products merged successfully.",
    data: result,
  });
  await activitiesService.activitiesCreateDB({
    ...activityActors(req),
    module: ActivityModule.product,
    entity_ids: [result.survivor?._id ?? req.body.survivor_id],
    action: ActivityAction.updated,
    title: "Products Merged",
  });
});

export const productController = {
    productCreate,
    allProduct ,
    singleProduct ,
    deleteProduct ,
    restoreProduct ,
    updateProduct,
    mergeProducts,
}
