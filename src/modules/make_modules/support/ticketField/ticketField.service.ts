import { TTicketField } from "./ticketField.interface";
import { TicketFieldModel } from "./ticketField.model";
import { createSupportCrudService } from "../shared/support.crud.service";
import { P } from "../shared/support.permissions";

export const ticketFieldService = createSupportCrudService<TTicketField>({
  model: TicketFieldModel,
  label: "Ticket field",
  perms: { manageAny: P.ticket.manage_support_tickets, manageOwn: P.ticket.manage_support_tickets },
  searchFields: ["name", "placeholder"],
  formatItem: (d) => ({
    _id: d._id,
    name: d.name,
    type: d.type,
    placeholder: d.placeholder ?? null,
    width: d.width ?? "6",
    order: d.order ?? 0,
    status: d.status ?? true,
    is_required: d.is_required ?? false,
    options: d.options ?? [],
    custom_id: d.custom_id ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }),
});
