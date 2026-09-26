import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import { TicketModel } from "../ticket/ticket.model";
import { generateTicketId } from "../ticket/ticket.service";
import { KnowledgeModel } from "../knowledge/knowledge.model";
import { FaqModel } from "../faq/faq.model";
import { ContactModel } from "../contact/contact.model";
import { CustomPageModel } from "../customPage/customPage.model";
import { QuickLinkModel } from "../quickLink/quickLink.model";
import { TicketCategoryModel } from "../ticketCategory/ticketCategory.model";
import { TicketFieldModel } from "../ticketField/ticketField.model";
import { setupService } from "../setup/setup.service";
import { ensureSupportDefaults } from "../shared/support.default";
import { companyScope } from "../shared/support.utils";

const POP = [{ path: "category", select: "name color" }];

const parseSetting = (raw: unknown) => {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
};

const bootstrapDB = async (companyId: string) => {
  await ensureSupportDefaults(companyId);
  const [brand, titleSections, ctaSections, supportInformation, contactInformation, quickLinks, customPages, fields, categories] =
    await Promise.all([
      setupService.getBrandDB(companyId),
      setupService.getSectionDB(companyId, setupService.keys.titleSections),
      setupService.getSectionDB(companyId, setupService.keys.ctaSections),
      setupService.getSectionDB(companyId, setupService.keys.supportInformation),
      setupService.getSectionDB(companyId, setupService.keys.contactInformation),
      QuickLinkModel.find({ ...companyScope(companyId) }).sort({ order: 1 }),
      CustomPageModel.find({ ...companyScope(companyId) }),
      TicketFieldModel.find({ ...companyScope(companyId), status: true }).sort({ order: 1 }),
      TicketCategoryModel.find({ ...companyScope(companyId) }).select("name color"),
    ]);

  const privacy = await setupService.getSectionDB(companyId, setupService.keys.privacyPolicy);
  const terms = await setupService.getSectionDB(companyId, setupService.keys.termsConditions);

  return {
    brand,
    titleSections,
    ctaSections,
    supportInformation,
    contactInformation,
    quickLinks,
    customPages: customPages.map((p) => ({
      slug: p.slug,
      title: p.title,
      enable_page_footer: p.enable_page_footer,
    })),
    fields,
    categories,
    privacy_policy_enabled: Boolean(parseSetting(privacy)?.enabled),
    terms_conditions_enabled: Boolean(parseSetting(terms)?.enabled),
    faq_is_on: true,
    knowledge_base_is_on: true,
  };
};

const createTicketDB = async (companyId: string, body: Record<string, unknown>) => {
  await ensureSupportDefaults(companyId);
  if (!body.name || !body.email || !body.subject || !body.description) {
    throw new AppError(httpStatus.BAD_REQUEST, "name, email, subject and description are required");
  }
  return TicketModel.create({
    user_id: companyId,
    creator_id: companyId,
    ticket_id: generateTicketId(),
    account_type: "custom",
    name: body.name,
    email: body.email,
    subject: body.subject,
    description: body.description,
    category: body.category || undefined,
    attachments: body.attachments || [],
    status: "In Progress",
  });
};

const searchDB = async (companyId: string, ticket_id: string, email: string) => {
  if (!ticket_id || !email) throw new AppError(httpStatus.BAD_REQUEST, "ticket_id and email are required");
  const ticket = await TicketModel.findOne({ user_id: companyId, ticket_id, email, isDeleted: false }).populate(POP);
  if (!ticket) throw new AppError(httpStatus.NOT_FOUND, "No ticket found with these details");
  return ticket;
};

const showDB = async (companyId: string, ticket_id: string) => {
  const ticket = await TicketModel.findOne({ user_id: companyId, ticket_id, isDeleted: false }).populate(POP);
  if (!ticket) throw new AppError(httpStatus.NOT_FOUND, "Ticket not found");
  return ticket;
};

const replyDB = async (companyId: string, ticket_id: string, body: Record<string, unknown>) => {
  const ticket = await TicketModel.findOne({ user_id: companyId, ticket_id, isDeleted: false });
  if (!ticket) throw new AppError(httpStatus.NOT_FOUND, "Ticket not found");
  if (!body.description) throw new AppError(httpStatus.BAD_REQUEST, "description is required");
  ticket.conversations?.push({
    sender: "customer",
    description: String(body.description),
    attachments: (body.attachments as { name?: string; path?: string }[]) || [],
  });
  await ticket.save();
  return ticket;
};

const knowledgeListDB = async (companyId: string) =>
  KnowledgeModel.find({ user_id: companyId, isDeleted: false }).populate({ path: "category", select: "title" }).sort({ createdAt: -1 });

const knowledgeArticleDB = async (companyId: string, id: string) => {
  const article = await KnowledgeModel.findOne({ _id: id, user_id: companyId, isDeleted: false }).populate({
    path: "category",
    select: "title",
  });
  if (!article) throw new AppError(httpStatus.NOT_FOUND, "Article not found");

  const related = await KnowledgeModel.find({
    user_id: companyId,
    isDeleted: false,
    category: article.category,
    _id: { $ne: article._id },
  })
    .limit(5)
    .select("title description");

  return { article, related };
};

const faqListDB = async (companyId: string) =>
  FaqModel.find({ user_id: companyId, isDeleted: false }).sort({ createdAt: -1 });

const contactSubmitDB = async (companyId: string, body: Record<string, unknown>) => {
  if (!body.email) throw new AppError(httpStatus.BAD_REQUEST, "email is required");
  return ContactModel.create({
    user_id: companyId,
    name: body.name,
    first_name: body.first_name,
    last_name: body.last_name,
    email: body.email,
    subject: body.subject,
    message: body.message,
  });
};

const customPageDB = async (companyId: string, slug: string) => {
  const page = await CustomPageModel.findOne({ user_id: companyId, slug, isDeleted: false });
  if (!page) throw new AppError(httpStatus.NOT_FOUND, "Page not found");
  return page;
};

const policyPageDB = async (companyId: string, key: string) => {
  const data = await setupService.getSectionDB(companyId, key);
  if (!data) throw new AppError(httpStatus.NOT_FOUND, "Page not found");
  return data;
};

export const publicSupportService = {
  bootstrapDB,
  createTicketDB,
  searchDB,
  showDB,
  replyDB,
  knowledgeListDB,
  knowledgeArticleDB,
  faqListDB,
  contactSubmitDB,
  customPageDB,
  policyPageDB,
};
