import { TTicketCategory } from "./ticketCategory.interface";
import { TicketCategoryModel } from "./ticketCategory.model";
import { createSupportCrudService } from "../shared/support.crud.service";
import { P } from "../shared/support.permissions";

export const ticketCategoryService = createSupportCrudService<TTicketCategory>({
  model: TicketCategoryModel,
  label: "Ticket category",
  perms: { manageAny: P.category.manage_any_ticket_categories, manageOwn: P.category.manage_own_ticket_categories },
  searchFields: ["name"],
  nameField: "name",
  formatItem: (d) => ({ _id: d._id, name: d.name, color: d.color ?? "#6B7280", createdAt: d.createdAt, updatedAt: d.updatedAt }),
});
