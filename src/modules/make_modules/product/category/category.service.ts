import { TCategory } from "./category.interface";
import { CategoryModel } from "./category.model";
import { withBulkDeleteId } from "../../../../utils/bulkDelete";

// CREATE
const createCategoryDB = async (payload: TCategory) => {
  const result = await CategoryModel.create(payload);
  return result;
};

// GET ALL — optional type filter (`category`/`type` query) + text search (`searchTerm`)
const getAllCategoryDB = async (
  user_id: string,
  typeFilter?: string,
  searchTerm?: string,
) => {
  const filter: Record<string, unknown> = { user_id };
  if (typeFilter) filter.type = typeFilter;
  const q = String(searchTerm || "").trim();
  if (q) {
    filter.category = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  }
  return CategoryModel.find(filter).select("category type parentCategory").sort({ createdAt: -1 });
};

// GET SINGLE
const getSingleCategoryDB = async (id: string, user_id: string) => {
  return await CategoryModel.findOne({ _id: id, user_id });
};

// UPDATE
const updateCategoryDB = async (id: string, payload: Partial<TCategory>, user_id: string) => {
  return await CategoryModel.findOneAndUpdate({ _id: id, user_id }, payload, {
    new: true,
  });
};

// DELETE
const deleteCategoryDBOne = async (id: string, user_id: string) => {
  return await CategoryModel.findOneAndDelete({ _id: id, user_id });
};

const deleteCategoryDB = withBulkDeleteId(deleteCategoryDBOne);

export const categoryService = {
  createCategoryDB,
  getAllCategoryDB,
  getSingleCategoryDB,
  updateCategoryDB,
  deleteCategoryDB,
};
