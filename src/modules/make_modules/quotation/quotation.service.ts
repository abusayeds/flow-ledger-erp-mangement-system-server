import httpStatus from "http-status";
import AppError from "../../../errors/AppError";
import { assertClientUser, CLIENT_POPULATE_SELECT } from "../../../utils/partyUser";
import { TQuotation } from "./quotation.interface";
import { ProductModel } from "../product/product.model";
import { ServiceModel } from "../service/service.model";
import { TProduct } from "../product/product.interface";
import { TService } from "../service/service.interface";
import { calculateInvoice } from "../utils/calculateInvoice";
import { validateItemAmount } from "../utils/validateItemAmount";
import { QuotationModel } from "./quotation.model";
import queryBuilder from "../../../builder/queryBuilder";
import { withBulkDeleteId } from "../../../utils/bulkDelete";

const validateCustomerAndLineItems = async (payload: TQuotation) => {
  if (payload.customer_id) {
    await assertClientUser(payload.customer_id);
  }
  if (Array.isArray(payload.product)) {
    for (const item of payload.product) {
      if (item.product_id) {
        const product = (await ProductModel.findById(item.product_id)) as TProduct;
        if (!product) {
          throw new AppError(httpStatus.NOT_FOUND, "Product not found with id: " + item.product_id);
        }
        // Submitted rate accepted as-is: the line rate is a historical record and
        // the form lets the user edit it freely (or type a name). Comparing it to
        // the CURRENT catalog price rejected edited rates and discounts.
      } else {
        // Typed name with no suggestion picked: add it to the catalog and use
        // the new id (matches the invoice create path).
        const createdProduct = await ProductModel.create({
          user_id: payload.user_id,
          productName: item.product_name,
          quantity: item.quantity,
          pricing: {
            buyPrice: 0,
            buyPriceTax: 0,
            sellPrice: item.rate,
            sellPriceTax: item.tax,
            currency: (payload as { currency?: string }).currency ?? "USD",
          },
          stock: { onHandStock: 0, committedStock: 0, availableForSale: 0, toBeInvoiced: 0, toBeBilled: 0 },
          description: item.description,
        });
        item.product_id = createdProduct._id;
      }
      validateItemAmount(item, "product");
    }
  }
  if (Array.isArray(payload.service)) {
    for (const item of payload.service) {
      if (item.service_id) {
        const service = (await ServiceModel.findById(item.service_id)) as TService;
        if (!service) {
          throw new AppError(httpStatus.NOT_FOUND, "Service not found with id: " + item.service_id);
        }
        // Submitted rate accepted as-is — see the product note above.
      } else if (!item.service_name) {
        throw new AppError(httpStatus.BAD_REQUEST, "service_name is required when service_id is not provided.");
      }
      validateItemAmount(item, "service");
    }
  }
};

const createDB = async (payload: TQuotation) => {
  await validateCustomerAndLineItems(payload);
  const result = await calculateInvoice(payload);
  const data = { ...payload, ...result };
  const createdRecord = await QuotationModel.create(data);
  return createdRecord;
};

const getSingleDB = async (id: string, userId: string) => {
  const record = await QuotationModel.findOne({
    _id: id,
    user_id: userId,
    isArchive: false,
    isDeleted: false,
  });
  if (!record) {
    throw new AppError(httpStatus.NOT_FOUND, "Quotation not found");
  }
  return record;
};

const getAllDB = async (query: Record<string, unknown>, user_id: string) => {
  const buildQuery = new queryBuilder(
    QuotationModel.find({
      user_id: user_id,
      isArchive: false,
      isDeleted: false,
    }).populate({
      path: "customer_id",
      select: CLIENT_POPULATE_SELECT,
    }),
    query
  )
    .search(["notes", "quotation_number"])
    .filter()
    .sort()
    .fields();
  const { totalData } = await buildQuery.paginate(
    QuotationModel.find({
      user_id: user_id,
      isArchive: false,
      isDeleted: false,
    })
  );
  const allRecords = await buildQuery.modelQuery.exec();
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query.limit) || 10;
  const pagination = buildQuery.calculatePagination({ totalData, currentPage, limit });
  return { allRecords, pagination };
};

const updateDB = async (id: string, userId: string, payload: Partial<TQuotation>) => {
  const existing = await QuotationModel.findOne({
    _id: id,
    user_id: userId
  });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Quotation not found");
  }

  const plain = existing.toObject() as TQuotation & { _id?: unknown; __v?: number };
  const patch = { ...payload } as Partial<TQuotation> & { _id?: unknown };
  delete patch.user_id;
  delete patch._id;
  const merged = { ...plain, ...patch } as TQuotation;
  merged.user_id = userId as unknown as TQuotation["user_id"];

  await validateCustomerAndLineItems(merged);
  const calculated = await calculateInvoice(merged);
  const data = { ...merged, ...calculated } as Record<string, unknown>;
  delete data._id;
  delete data.__v;

  const updated = await QuotationModel.findOneAndUpdate(
    { _id: id, user_id: userId },
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!updated) {
    throw new AppError(httpStatus.NOT_FOUND, "Quotation not found");
  }
  return updated;
};

const deleteDBOne = async (id: string, userId: string) => {
  const doc = await QuotationModel.findOneAndUpdate(
    { _id: id, user_id: userId, isDeleted: false },
    { isDeleted: true, isArchive: true },
    { new: true }
  );
  if (!doc) {
    throw new AppError(httpStatus.NOT_FOUND, "Quotation not found");
  }
  return doc;
};

const deleteDB = withBulkDeleteId(deleteDBOne);

export const quotationService = { createDB, getSingleDB, getAllDB, updateDB, deleteDB };

