import httpStatus from "http-status";
import { Response } from "express";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { publicSupportService } from "./public.service";
import { setupService } from "../setup/setup.service";

const ok = (res: Response, message: string, data: unknown) =>
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message, data });

const bootstrap = catchAsync(async (req, res) =>
  ok(res, "Public portal data retrieved successfully.", await publicSupportService.bootstrapDB(req.params.companyId)));

const createTicket = catchAsync(async (req, res) =>
  ok(res, "Ticket created successfully.", await publicSupportService.createTicketDB(req.params.companyId, req.body)));

const search = catchAsync(async (req, res) =>
  ok(res, "Ticket found successfully.", await publicSupportService.searchDB(req.params.companyId, req.body.ticket_id, req.body.email)));

const show = catchAsync(async (req, res) =>
  ok(res, "Ticket retrieved successfully.", await publicSupportService.showDB(req.params.companyId, req.params.ticketId)));

const reply = catchAsync(async (req, res) =>
  ok(res, "Reply sent successfully.", await publicSupportService.replyDB(req.params.companyId, req.params.ticketId, req.body)));

const knowledge = catchAsync(async (req, res) =>
  ok(res, "Knowledge articles retrieved successfully.", await publicSupportService.knowledgeListDB(req.params.companyId)));

const knowledgeArticle = catchAsync(async (req, res) =>
  ok(res, "Knowledge article retrieved successfully.", await publicSupportService.knowledgeArticleDB(req.params.companyId, req.params.id)));

const faq = catchAsync(async (req, res) =>
  ok(res, "FAQs retrieved successfully.", await publicSupportService.faqListDB(req.params.companyId)));

const contact = catchAsync(async (req, res) =>
  ok(res, "Contact submitted successfully.", await publicSupportService.contactSubmitDB(req.params.companyId, req.body)));

const page = catchAsync(async (req, res) =>
  ok(res, "Page retrieved successfully.", await publicSupportService.customPageDB(req.params.companyId, req.params.slug)));

const privacyPolicy = catchAsync(async (req, res) =>
  ok(res, "Privacy policy retrieved successfully.", await publicSupportService.policyPageDB(req.params.companyId, setupService.keys.privacyPolicy)));

const termsConditions = catchAsync(async (req, res) =>
  ok(res, "Terms and conditions retrieved successfully.", await publicSupportService.policyPageDB(req.params.companyId, setupService.keys.termsConditions)));

export const publicSupportController = {
  bootstrap,
  createTicket,
  search,
  show,
  reply,
  knowledge,
  knowledgeArticle,
  faq,
  contact,
  page,
  privacyPolicy,
  termsConditions,
};
