import { TQuickLink } from "./quickLink.interface";
import { QuickLinkModel } from "./quickLink.model";
import { createSupportCrudService } from "../shared/support.crud.service";
import { P } from "../shared/support.permissions";

export const quickLinkService = createSupportCrudService<TQuickLink>({
  model: QuickLinkModel,
  label: "Quick link",
  perms: { manageAny: P.quickLink.manage_support_ticket_quick_links, manageOwn: P.quickLink.manage_support_ticket_quick_links },
  searchFields: ["title", "link"],
  formatItem: (d) => ({
    _id: d._id,
    title: d.title,
    icon: d.icon ?? null,
    link: d.link ?? null,
    order: d.order ?? 0,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }),
});
