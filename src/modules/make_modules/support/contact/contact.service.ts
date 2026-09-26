import { TContact } from "./contact.interface";
import { ContactModel } from "./contact.model";
import { createSupportCrudService } from "../shared/support.crud.service";
import { P } from "../shared/support.permissions";

export const contactService = createSupportCrudService<TContact>({
  model: ContactModel,
  label: "Contact submission",
  perms: { manageAny: P.contact.manage_any_contact, manageOwn: P.contact.manage_own_contact },
  searchFields: ["name", "email", "subject", "message", "first_name", "last_name"],
  formatItem: (d) => ({
    _id: d._id,
    name: d.name ?? null,
    first_name: d.first_name ?? null,
    last_name: d.last_name ?? null,
    email: d.email,
    subject: d.subject ?? null,
    message: d.message ?? null,
    createdAt: d.createdAt,
  }),
});
