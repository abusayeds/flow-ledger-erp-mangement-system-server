import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../../errors/AppError";
import queryBuilder from "../../../../builder/queryBuilder";
import { AuthRequest } from "../../../../middlewares/auth";
import { UserModel } from "../../../basic_modules/user/user.model";
import { CUSTOMER_ROLE_SET, VENDOR_ROLE_SET } from "../../../../utils/role";
import { TTicket, TTicketConversation } from "./ticket.interface";
import { TicketModel } from "./ticket.model";
import { TicketCategoryModel } from "../ticketCategory/ticketCategory.model";
import { TicketFieldModel } from "../ticketField/ticketField.model";
import { KnowledgeCategoryModel } from "../knowledgeCategory/knowledgeCategory.model";
import { ticketFieldValueService } from "../ticketFieldValue/ticketFieldValue.service";
import { P } from "../shared/support.permissions";
import { ensureSupportDefaults } from "../shared/support.default";
import {
  applyTicketOwnershipToQuery,
  companyObjectId,
  companyScope,
  creatorObjectId,
  refLabel,
  resolveCompanyId,
  resolveSupportOwnership,
} from "../shared/support.utils";
import { withBulkDeleteAuthId, withBulkDeleteAuthChildId } from "../../../../utils/bulkDelete";

const LIST_POP = [
  { path: "category", select: "name color" },
  { path: "ticket_user_id", select: "name email" },
];
const FULL_POP = [
  { path: "category", select: "name color" },
  { path: "ticket_user_id", select: "name email" },
];

export const generateTicketId = () => String(Math.floor(Date.now() / 1000));

const formatListItem = (doc: TTicket & { category?: unknown; ticket_user_id?: unknown }) => ({
  _id: doc._id,
  ticket_id: doc.ticket_id,
  name: doc.name,
  email: doc.email,
  account_type: doc.account_type,
  subject: doc.subject,
  status: doc.status,
  category: refLabel(doc.category) ?? { _id: "", name: "No Category" },
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const formatSingle = async (doc: TTicket & { category?: unknown; ticket_user_id?: unknown }, companyId: string) => {
  const fields = doc._id ? await ticketFieldValueService.getFieldData(companyId, doc._id as Types.ObjectId) : {};
  return {
    _id: doc._id,
    ticket_id: doc.ticket_id,
    name: doc.name,
    email: doc.email,
    account_type: doc.account_type,
    ticket_user_id: doc.ticket_user_id,
    user: refLabel(doc.ticket_user_id),
    category: refLabel(doc.category),
    subject: doc.subject,
    status: doc.status,
    description: doc.description,
    attachments: doc.attachments ?? [],
    note: doc.note,
    fields,
    conversations: doc.conversations ?? [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const ownershipOf = (req: AuthRequest) =>
  resolveSupportOwnership(req, P.ticket.manage_any_support_tickets, P.ticket.manage_own_support_tickets);

const resolveAssignedUser = async (body: Record<string, unknown>, companyId: string) => {
  const accountType = String(body.account_type || "custom");
  if (accountType === "custom") return body;

  const userId = body.ticket_user_id || body.user_id;
  if (!userId || !Types.ObjectId.isValid(String(userId))) {
    throw new AppError(httpStatus.BAD_REQUEST, "Valid user is required for this account type");
  }
  const user = await UserModel.findOne({
    _id: userId,
    companyId: companyObjectId(companyId),
    isDeleted: false,
  });
  if (!user) throw new AppError(httpStatus.BAD_REQUEST, "Selected user is invalid");

  const roleMap: Record<string, string> = { staff: "staff", client: "customer", vendor: "vendor" };
  const expected = roleMap[accountType];
  if (expected && user.role !== expected && !(accountType === "client" && user.role === "client")) {
    throw new AppError(httpStatus.BAD_REQUEST, "Selected user does not match account type");
  }

  body.ticket_user_id = user._id;
  body.name = user.name;
  body.email = user.email;
  return body;
};

const normalizeAttachments = (raw: unknown) => {
  if (!raw) return [];
  const paths = Array.isArray(raw) ? raw : [];
  return paths
    .filter((p) => p && p !== "logo_dark" && p !== "favicon")
    .map((p) => {
      if (typeof p === "object" && p !== null && "path" in p) return p as { name?: string; path?: string };
      const path = String(p);
      return { name: path.split("/").pop() || path, path };
    });
};

const getOwned = async (req: AuthRequest, id: string) => {
  const companyId = resolveCompanyId(req);
  const ownership = ownershipOf(req);
  const base = applyTicketOwnershipToQuery({ _id: id, ...companyScope(companyId) }, ownership);
  const doc = await TicketModel.findOne(base).populate(FULL_POP);
  if (!doc) throw new AppError(httpStatus.NOT_FOUND, "Ticket not found");
  return doc;
};

const createDB = async (req: AuthRequest, body: Record<string, unknown>) => {
  const companyId = resolveCompanyId(req);
  await ensureSupportDefaults(companyId);
  let payload = { ...body };
  payload = await resolveAssignedUser(payload, companyId);

  if (!payload.subject) throw new AppError(httpStatus.BAD_REQUEST, "subject is required");
  if (!payload.description) throw new AppError(httpStatus.BAD_REQUEST, "description is required");
  if (!payload.category) throw new AppError(httpStatus.BAD_REQUEST, "category is required");

  const category = await TicketCategoryModel.findOne({ _id: payload.category, ...companyScope(companyId) });
  if (!category) throw new AppError(httpStatus.BAD_REQUEST, "Selected category is invalid");

  const ticket = await TicketModel.create({
    user_id: companyObjectId(companyId),
    creator_id: creatorObjectId(req),
    ticket_id: payload.ticket_id || generateTicketId(),
    name: payload.name,
    email: payload.email,
    account_type: payload.account_type || "custom",
    ticket_user_id: payload.ticket_user_id,
    category: payload.category,
    subject: payload.subject,
    status: payload.status || "In Progress",
    description: payload.description,
    attachments: normalizeAttachments(payload.attachments),
    note: payload.note,
  });

  const fieldPayload = (payload.fields || payload.custom_fields) as Record<string, unknown> | undefined;
  await ticketFieldValueService.saveFieldData(companyId, ticket._id as Types.ObjectId, fieldPayload);

  const populated = await TicketModel.findById(ticket._id).populate(FULL_POP);
  return formatSingle(populated as TTicket, companyId);
};

const getAllDB = async (req: AuthRequest, query: Record<string, unknown>) => {
  const companyId = resolveCompanyId(req);
  const ownership = ownershipOf(req);
  const base = applyTicketOwnershipToQuery(companyScope(companyId), ownership);
  const filter: Record<string, unknown> = { ...base };
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.account_type) filter.account_type = query.account_type;

  let mq = TicketModel.find(filter).populate(LIST_POP);
  const qb = new queryBuilder(mq, query)
    .search(["ticket_id", "name", "email", "subject"] as never)
    .filter()
    .sort()
    .fields();
  const { totalData } = await qb.paginate(TicketModel.find(filter));
  const rows = await qb.modelQuery.exec();
  const data = rows.map((d) => formatListItem(d as TTicket));
  const currentPage = Number(query?.page) || 1;
  const limit = Number(query?.limit) || 10;
  const pagination = qb.calculatePagination({ totalData, currentPage, limit });
  return { data, pagination };
};

const getSingleDB = async (req: AuthRequest, id: string) => {
  const companyId = resolveCompanyId(req);
  const doc = await getOwned(req, id);
  return formatSingle(doc as TTicket, companyId);
};

const updateDB = async (req: AuthRequest, id: string, body: Record<string, unknown>) => {
  const companyId = resolveCompanyId(req);
  await getOwned(req, id);
  let payload = { ...body };
  delete payload.user_id;
  delete payload.creator_id;
  if (payload.account_type || payload.ticket_user_id || payload.user_id) {
    payload = await resolveAssignedUser(payload, companyId);
  }
  if (payload.attachments) payload.attachments = normalizeAttachments(payload.attachments);

  const fieldPayload = (payload.fields || payload.custom_fields) as Record<string, unknown> | undefined;
  delete payload.fields;
  delete payload.custom_fields;

  const updated = await TicketModel.findOneAndUpdate(
    { _id: id, ...companyScope(companyId) },
    payload,
    { new: true, runValidators: true },
  ).populate(FULL_POP);
  if (!updated) throw new AppError(httpStatus.NOT_FOUND, "Ticket not found");
  if (fieldPayload) await ticketFieldValueService.saveFieldData(companyId, updated._id as Types.ObjectId, fieldPayload);
  return formatSingle(updated as TTicket, companyId);
};

const deleteDBOne = async (req: AuthRequest, id: string) => {
  const companyId = resolveCompanyId(req);
  await getOwned(req, id);
  await TicketModel.findOneAndUpdate({ _id: id, ...companyScope(companyId) }, { isDeleted: true });
  await ticketFieldValueService.removeFieldData(companyId, new Types.ObjectId(id));
  return { _id: id };
};

const changeStatusDB = async (req: AuthRequest, id: string, status: string) => {
  await getOwned(req, id);
  const companyId = resolveCompanyId(req);
  const updated = await TicketModel.findOneAndUpdate(
    { _id: id, ...companyScope(companyId) },
    { status },
    { new: true },
  ).populate(FULL_POP);
  if (!updated) throw new AppError(httpStatus.NOT_FOUND, "Ticket not found");
  return formatSingle(updated as TTicket, companyId);
};

const storeNoteDB = async (req: AuthRequest, id: string, note: string) => {
  await getOwned(req, id);
  const companyId = resolveCompanyId(req);
  const updated = await TicketModel.findOneAndUpdate(
    { _id: id, ...companyScope(companyId) },
    { note },
    { new: true },
  ).populate(FULL_POP);
  if (!updated) throw new AppError(httpStatus.NOT_FOUND, "Ticket not found");
  return formatSingle(updated as TTicket, companyId);
};

const addReplyDB = async (req: AuthRequest, id: string, reply: TTicketConversation) => {
  await getOwned(req, id);
  const companyId = resolveCompanyId(req);
  const updated = await TicketModel.findOneAndUpdate(
    { _id: id, ...companyScope(companyId) },
    { $push: { conversations: { ...reply, sender: reply.sender || "admin", creator_id: creatorObjectId(req) } } },
    { new: true },
  ).populate(FULL_POP);
  if (!updated) throw new AppError(httpStatus.NOT_FOUND, "Ticket not found");
  return formatSingle(updated as TTicket, companyId);
};

const updateReplyDB = async (req: AuthRequest, id: string, replyId: string, data: Record<string, unknown>) => {
  await getOwned(req, id);
  const companyId = resolveCompanyId(req);
  const set: Record<string, unknown> = {};
  for (const k of Object.keys(data || {})) set[`conversations.$[el].${k}`] = data[k];
  const updated = await TicketModel.findOneAndUpdate(
    { _id: id, ...companyScope(companyId) },
    { $set: set },
    { new: true, arrayFilters: [{ "el._id": replyId }] },
  ).populate(FULL_POP);
  if (!updated) throw new AppError(httpStatus.NOT_FOUND, "Ticket not found");
  return formatSingle(updated as TTicket, companyId);
};

const deleteReplyDBOne = async (req: AuthRequest, id: string, replyId: string) => {
  await getOwned(req, id);
  const companyId = resolveCompanyId(req);
  const updated = await TicketModel.findOneAndUpdate(
    { _id: id, ...companyScope(companyId) },
    { $pull: { conversations: { _id: replyId } } },
    { new: true },
  ).populate(FULL_POP);
  if (!updated) throw new AppError(httpStatus.NOT_FOUND, "Ticket not found");
  return formatSingle(updated as TTicket, companyId);
};

const deleteAttachmentDB = async (req: AuthRequest, id: string, path: string) => {
  await getOwned(req, id);
  const companyId = resolveCompanyId(req);
  const updated = await TicketModel.findOneAndUpdate(
    { _id: id, ...companyScope(companyId) },
    { $pull: { attachments: { path } } },
    { new: true },
  ).populate(FULL_POP);
  if (!updated) throw new AppError(httpStatus.NOT_FOUND, "Ticket not found");
  return formatSingle(updated as TTicket, companyId);
};

const getRequestDataDB = async (req: AuthRequest) => {
  const companyId = resolveCompanyId(req);
  await ensureSupportDefaults(companyId);

  const [ticket_categories, staff, clients, vendors, knowledge_categories, fields] = await Promise.all([
    TicketCategoryModel.find({ ...companyScope(companyId) }).select("name color"),
    UserModel.find({ companyId: companyObjectId(companyId), role: "staff", isDeleted: false }).select("name email"),
    UserModel.find({ companyId: companyObjectId(companyId), role: { $in: [...CUSTOMER_ROLE_SET] }, isDeleted: false }).select("name email"),
    UserModel.find({ companyId: companyObjectId(companyId), role: { $in: [...VENDOR_ROLE_SET] }, isDeleted: false }).select("name email"),
    KnowledgeCategoryModel.find({ ...companyScope(companyId) }).select("title"),
    TicketFieldModel.find({ ...companyScope(companyId), status: true }).sort({ order: 1 }),
  ]);

  return {
    ticket_categories,
    staff,
    client: clients,
    vendor: vendors,
    knowledges_categories: knowledge_categories,
    fields,
  };
};

const deleteDB = withBulkDeleteAuthId(deleteDBOne);
const deleteReplyDB = withBulkDeleteAuthChildId(deleteReplyDBOne);

export const ticketService = {
  createDB,
  getAllDB,
  getSingleDB,
  updateDB,
  deleteDB,
  changeStatusDB,
  storeNoteDB,
  addReplyDB,
  updateReplyDB,
  deleteReplyDB,
  deleteAttachmentDB,
  getRequestDataDB,
  getOwned,
};
