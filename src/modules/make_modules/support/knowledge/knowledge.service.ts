import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../../errors/AppError";
import { AuthRequest } from "../../../../middlewares/auth";
import { TKnowledge } from "./knowledge.interface";
import { KnowledgeModel } from "./knowledge.model";
import { KnowledgeCategoryModel } from "../knowledgeCategory/knowledgeCategory.model";
import { createSupportCrudService } from "../shared/support.crud.service";
import { P } from "../shared/support.permissions";
import { companyScope, refLabel, resolveCompanyId } from "../shared/support.utils";

const validateCategory = async (body: Record<string, unknown>, req: AuthRequest) => {
  const categoryId = body.category;
  if (categoryId !== undefined && categoryId !== null && categoryId !== "") {
    if (!Types.ObjectId.isValid(String(categoryId))) {
      throw new AppError(httpStatus.BAD_REQUEST, "Valid category is required");
    }
    const cat = await KnowledgeCategoryModel.findOne({
      _id: categoryId,
      ...companyScope(resolveCompanyId(req)),
    });
    if (!cat) throw new AppError(httpStatus.BAD_REQUEST, "Knowledge category not found");
  }
  return body;
};

export const knowledgeService = createSupportCrudService<TKnowledge>({
  model: KnowledgeModel,
  label: "Knowledge article",
  perms: { manageAny: P.knowledge.manage_any_knowledge_base, manageOwn: P.knowledge.manage_own_knowledge_base },
  searchFields: ["title", "description"],
  populate: { path: "category", select: "title" },
  beforeCreate: validateCategory,
  beforeUpdate: validateCategory,
  formatItem: (d) => ({
    _id: d._id,
    title: d.title,
    description: d.description ?? null,
    category: refLabel(d.category as never, "title"),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }),
});
