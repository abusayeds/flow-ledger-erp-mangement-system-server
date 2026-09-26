import httpStatus from "http-status";
import AppError from "../../../errors/AppError";
import { TProduct } from "./product.interface"
import { ProductModel } from "./product.model";
import queryBuilder from "../../../builder/queryBuilder";
import { CategoryModel } from "./category/category.model";
import { TaxModel } from "./tax/tax.model";
import { taxTypesForProduct } from "./tax/tax.interface";
import { withBulkDeleteIdSecond } from "../../../utils/bulkDelete";
import { mergeCatalogItemsDB } from "../../../utils/catalogMerge";

const productCreateDB = async (payload : TProduct) => {
  // Category is OPTIONAL and not tightly coupled: only validate when one is
  // provided, and if the referenced category no longer exists just drop it
  // rather than failing the whole create (previously an empty/stale category
  // threw "Category not found" — e.g. on duplicate or a category-less product).
  if (payload.category) {
    const isExistCategory = await CategoryModel.findOne({ _id: payload.category });
    if (!isExistCategory) { delete (payload as { category?: unknown }).category; }
  }
  if (payload.tax) {
    const isExistTax = await TaxModel.findOne({
      _id: payload.tax,
      user_id: payload.user_id,
      type: { $in: [...taxTypesForProduct] },
    });
    if (!isExistTax) {throw new AppError( httpStatus.NOT_FOUND ,"Tax not found")}
  }
  const result = await ProductModel.create(payload);
  return result;
}

const allProductDB = async (user_id :  string , query : Record<string, unknown>) => {
 // Active/Archive/Trash tabs are handled by the queryBuilder soft-delete engine
 // (?isArchive=true / ?isDeleted=true; default hides both). Category filter
 // supports a single id or a comma-separated list (multi-select).
 if (typeof query.category === "string" && query.category.includes(",")) {
   const ids = query.category
     .split(",")
     .map((s) => s.trim())
     .filter(Boolean);
   query.category = { $in: ids } as never;
 }

 const productQuery  =  new queryBuilder(ProductModel.find({ user_id }), query);
 await productQuery.searchNested({
   localFields: ["productName", "sku"],
   refs: [
     {
       foreignField: "category",
       model: CategoryModel as never,
       fields: ["category"],
     },
   ],
 });
 productQuery.filter().sort().fields();
 const {totalData } = await productQuery.paginate();
 const allProduct = await productQuery.modelQuery.exec();
 const currentPage = Number(query?.page) || 1;
 const limit = Number(query.limit) || 10;
 const pagination = productQuery.calculatePagination({ totalData, currentPage, limit });
 return { allProduct, pagination }
}
const singleProductDB = async (user_id :  string , id : string) => {
  const result = await ProductModel.findOne({ user_id, _id: id } );
  return result;
}
const deleteProductDBOne = async (user_id :  string , id : string) => {
  const result = await ProductModel.findOneAndUpdate({ user_id, _id: id } , { isDeleted: true } , {new : true} );
  return result;
}
const restoreProductDBOne = async (user_id :  string , id : string) => {
  const result = await ProductModel.findOneAndUpdate({ user_id, _id: id } , { isDeleted: false } , {new : true} );
  return result;
}
const updateProductDB = async (user_id : string , id : string , payload : TProduct) => {
  const existing = await ProductModel.findOne({ user_id, _id: id });
  if (!existing) {throw new AppError(httpStatus.NOT_FOUND, "Product not found")}
  if (payload.category) {
    // Optional / decoupled — drop a stale category ref instead of failing.
    const isExistCategory = await CategoryModel.findOne({ _id: payload.category });
    if (!isExistCategory) { delete (payload as { category?: unknown }).category; }
  }
  if (payload.tax) {
    const isExistTax = await TaxModel.findOne({
      _id: payload.tax,
      user_id,
      type: { $in: [...taxTypesForProduct] }
    });
    if (!isExistTax) {throw new AppError(httpStatus.NOT_FOUND, "Tax not found")}
  }
  const result = await ProductModel.findOneAndUpdate(
    { user_id, _id: id },
    payload,
    { new: true, runValidators: true }
  );
  return result;
}
const deleteProductDB = withBulkDeleteIdSecond(deleteProductDBOne);
const restoreProductDB = withBulkDeleteIdSecond(restoreProductDBOne);

const mergeProductsDB = async (
  user_id: string,
  survivorId: string,
  mergedIds: string[],
) =>
  mergeCatalogItemsDB({
    Model: ProductModel,
    userId: user_id,
    survivorId,
    mergedIdsRaw: mergedIds,
    label: "Product",
    refField: "product_id",
    foldStock: true,
  });

export const productService  = {
    productCreateDB,
    allProductDB  ,
    singleProductDB ,
    deleteProductDB ,
    restoreProductDB ,
    updateProductDB,
    mergeProductsDB,
}