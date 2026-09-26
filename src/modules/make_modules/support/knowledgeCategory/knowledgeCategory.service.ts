import { TKnowledgeCategory } from "./knowledgeCategory.interface";
import { KnowledgeCategoryModel } from "./knowledgeCategory.model";
import { createSupportCrudService } from "../shared/support.crud.service";
import { P } from "../shared/support.permissions";

export const knowledgeCategoryService = createSupportCrudService<TKnowledgeCategory>({
  model: KnowledgeCategoryModel,
  label: "Knowledge category",
  perms: { manageAny: P.knowledge.manage_any_knowledge_base, manageOwn: P.knowledge.manage_own_knowledge_base },
  searchFields: ["title"],
  nameField: "title",
  formatItem: (d) => ({ _id: d._id, title: d.title, createdAt: d.createdAt, updatedAt: d.updatedAt }),
});
