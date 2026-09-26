import { ServiceModel } from "./service.model";
import AppError from "../../../errors/AppError";
import httpStatus from "http-status";
import { TService } from "./service.interface";
import queryBuilder from "../../../builder/queryBuilder";
import { withBulkDeleteIdSecond } from "../../../utils/bulkDelete";
import { mergeCatalogItemsDB } from "../../../utils/catalogMerge";

const createServiceDB = async (payload: TService) => {
  return await ServiceModel.create(payload);
};


const getAllServiceDB = async (user_id :  string , query : Record<string, unknown>) => {
 // isDeleted/isArchive are NOT hard-coded here: queryBuilder.filter() applies
 // buildSoftDeleteFilter, which defaults to "active only" and honours
 // ?isDeleted=true (Trash tab) and ?isArchive=true (Archive tab). Pinning them
 // false here made those tabs permanently empty.
 const serviceQuery  =  new queryBuilder(ServiceModel.find({ user_id } ), query) .search(["serviceName", "unitType", "description"]).filter().sort().fields();
 const {totalData } = await serviceQuery.paginate();
 const allService = await serviceQuery.modelQuery.exec();
 const currentPage = Number(query?.page) || 1;
 const limit = Number(query.limit) || 10;
 const pagination = serviceQuery.calculatePagination({ totalData, currentPage, limit });
 return { allService, pagination }
}

const getSingleServiceDB = async (user_id: string, id: string) => {
  const data = await ServiceModel.findOne({
    _id: id,
    user_id,
    isDeleted: false,
  });

  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, "Service not found");
  }

  return data;
};

const updateServiceDB = async (
  user_id: string,
  id: string,
  payload: Partial<TService>
) => {
  const data = await ServiceModel.findOneAndUpdate(
    { _id: id, user_id },
    payload,
    { new: true }
  );

  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, "Service not found");
  }

  return data;
};


const deleteServiceDBOne = async (user_id: string, id: string) => {
  const result = await ServiceModel.findOneAndUpdate(
    { user_id, _id: id },
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Service not found");
  }
  return result;
};

const deleteServiceDB = withBulkDeleteIdSecond(deleteServiceDBOne);

const mergeServicesDB = async (
  user_id: string,
  survivorId: string,
  mergedIds: string[],
) =>
  mergeCatalogItemsDB({
    Model: ServiceModel,
    userId: user_id,
    survivorId,
    mergedIdsRaw: mergedIds,
    label: "Service",
    refField: "service_id",
    foldStock: false,
  });

export const ServiceService = {
  createServiceDB,
  getAllServiceDB,
  getSingleServiceDB,
  updateServiceDB,
  deleteServiceDB,
  mergeServicesDB,
};