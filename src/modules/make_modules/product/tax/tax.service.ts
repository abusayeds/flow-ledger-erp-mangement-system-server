import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { TAX_TYPES, TTax, TTaxType } from "./tax.interface";
import { TaxModel } from "./tax.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

const parseTaxType = (typeInput: unknown, label = "type"): TTaxType => {
  if (typeInput === undefined || typeInput === null || typeInput === "") {
    return "both";
  }

  if (typeInput === undefined || typeInput === null || typeInput === "") {
    throw new AppError(httpStatus.BAD_REQUEST, `${label} is required (product, service, or both)`);
  }
  const value = String(typeInput).trim().toLowerCase();
  if (!TAX_TYPES.includes(value as TTaxType)) {
    throw new AppError(httpStatus.BAD_REQUEST, `${label} must be product, service, or both`);
  }
  return value as TTaxType;
};

const createTaxDB = async (payload: TTax) => {
  const type = parseTaxType(payload.type);
  const result = await TaxModel.create({ ...payload, type });
  return result;
};

const getAllTaxDB = async (user_id: string, query: Record<string, unknown>) => {
  const taxQuery = new queryBuilder(TaxModel.find({ user_id }), query)
    .search(["name"])
    .filter()
    .sort()
    .fields();
  return taxQuery.modelQuery.exec();
};

const getSingleTaxDB = async (id: string, user_id: string) => {
  return await TaxModel.findOne({ _id: id, user_id });
};

const updateTaxDB = async (id: string, payload: Partial<TTax>, user_id: string) => {
  if (payload.type !== undefined) {
    payload.type = parseTaxType(payload.type);
  }
  return await TaxModel.findOneAndUpdate({ _id: id, user_id }, payload, {
    new: true,
    runValidators: true
  });
};

const deleteTaxDBOne = async (id: string, user_id: string) => {
  return await TaxModel.findOneAndDelete({ _id: id, user_id });
};

const deleteTaxDB = withBulkDeleteId(deleteTaxDBOne);

export const taxService = {
  createTaxDB,
  getAllTaxDB,
  getSingleTaxDB,
  updateTaxDB,
  deleteTaxDB,
};
