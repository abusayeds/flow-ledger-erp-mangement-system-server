import { TCustomPage } from "./customPage.interface";
import { CustomPageModel } from "./customPage.model";
import { createSupportCrudService } from "../shared/support.crud.service";
import { P } from "../shared/support.permissions";

export const customPageService = createSupportCrudService<TCustomPage>({
  model: CustomPageModel,
  label: "Custom page",
  perms: { manageAny: P.customPage.manage_support_ticket_custom_pages, manageOwn: P.customPage.manage_support_ticket_custom_pages },
  searchFields: ["title", "slug", "description"],
  nameField: "slug",
  formatItem: (d) => ({
    _id: d._id,
    title: d.title,
    slug: d.slug,
    enable_page_footer: d.enable_page_footer ?? false,
    contents: d.contents ?? null,
    description: d.description ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }),
});
