import { TFaq } from "./faq.interface";
import { FaqModel } from "./faq.model";
import { createSupportCrudService } from "../shared/support.crud.service";
import { P } from "../shared/support.permissions";

export const faqService = createSupportCrudService<TFaq>({
  model: FaqModel,
  label: "FAQ",
  perms: { manageAny: P.faq.manage_any_faq, manageOwn: P.faq.manage_own_faq },
  searchFields: ["title", "description"],
  formatItem: (d) => ({
    _id: d._id,
    title: d.title,
    description: d.description ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }),
});
