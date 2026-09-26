import httpStatus from "http-status";
import AppError from "../../../errors/AppError";
import { IUser } from "../../basic_modules/user/user.interface";
import { emailTemplateService } from "../setting/emailTemplate/emailTemplate.service";
import {
  documentEmailTemplateKey,
  TDocumentEmailSendBody,
} from "./documentEmail.interface";
import { generateDocumentPdfBuffer } from "./helpers/generatePdfBuffer";
import {
  buildTemplateVars,
  mergeTemplateString,
  splitEmailList,
} from "./helpers/mergeTemplate";
import { getDocumentModel, resolveDocumentForEmail } from "./helpers/resolveDocument";
import { sendDocumentMail } from "./helpers/sendMail";

const defaultSubject = (type: string, number: string | null, company: string | null) => {
  const label = type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const num = number ? ` #${number}` : "";
  const from = company ? ` from ${company}` : "";
  return `${label}${num}${from}`;
};

const defaultBody = (partyName: string | null, number: string | null, company: string | null) => {
  const name = partyName || "Customer";
  const doc = number ? `document #${number}` : "document";
  const sign = company || "Our team";
  return `<p>Dear ${name},</p><p>Please find the attached ${doc}.</p><p>Regards,<br/>${sign}</p>`;
};

const prepareDB = async (user: IUser, type: string, id: string) => {
  const { type: docType, pdfType, document } = await resolveDocumentForEmail(type, id, user);
  const templateDoc = await emailTemplateService.getDB(String(user._id));
  const templateKey = documentEmailTemplateKey(docType);
  const item = templateDoc?.templates?.[templateKey] || {};
  const settings = templateDoc?.settings || {};
  const signature = templateDoc?.signature || "";
  const vars = buildTemplateVars(document);

  let subject = mergeTemplateString(item.subject, vars);
  let body = mergeTemplateString(item.body, vars);
  if (!subject) subject = defaultSubject(docType, document.number, document.company_name);
  if (!body) body = defaultBody(document.party_name, document.number, document.company_name);
  if (signature) {
    body = `${body}<br/><br/>${signature}`;
  }

  const pdfFileName =
    mergeTemplateString(item.pdf_file_name, vars) ||
    `${docType.replace(/_/g, "-")}-${document.number || document._id}.pdf`;

  const to = document.party_email ? [document.party_email] : [];
  const cc = splitEmailList(item.cc);
  const bcc = splitEmailList(item.bcc);

  return {
    type: docType,
    pdf_type: pdfType,
    document: {
      _id: document._id,
      number: document.number,
      status: document.status,
      total: document.total,
      date: document.date,
      due_date: document.due_date,
      currency: document.currency,
      party_name: document.party_name,
      party_email: document.party_email,
      company_name: document.company_name,
    },
    email: {
      to,
      cc,
      bcc,
      from: settings.from || document.company_name || "",
      subject,
      body,
      pdf_file_name: pdfFileName,
    },
  };
};

const sendDB = async (user: IUser, payload: TDocumentEmailSendBody) => {
  if (!payload || typeof payload !== "object") {
    throw new AppError(httpStatus.BAD_REQUEST, "Request body is required");
  }
   console.log(typeof payload.type);

  if (!payload.document_update || typeof payload.document_update !== "object") {
    throw new AppError(httpStatus.BAD_REQUEST, "document_update is required");
  }
  if (!Object.keys(payload.document_update).length) {
    throw new AppError(httpStatus.BAD_REQUEST, "document_update must not be empty");
  }
  if (!payload.email || typeof payload.email !== "object") {
    throw new AppError(httpStatus.BAD_REQUEST, "email is required");
  }

  const { type, pdfType, document } = await resolveDocumentForEmail(
    payload.type,
    payload.id,
    user,
  );

  const to = splitEmailList(payload.email.to);
  const cc = splitEmailList(payload.email.cc);
  const bcc = splitEmailList(payload.email.bcc);
  const subject = String(payload.email.subject || "").trim();
  const body = String(payload.email.body || "").trim();
  const fromDisplayName = String(payload.email.from || "").trim();
  const attachPdf = payload.attach_pdf !== false;

  if (!to.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "email.to is required");
  }

  const vars = buildTemplateVars(document);
  const templateDoc = await emailTemplateService.getDB(String(user._id));
  const templateKey = documentEmailTemplateKey(type);
  const item = templateDoc?.templates?.[templateKey] || {};
  const pdfFileName =
    mergeTemplateString(item.pdf_file_name, vars) ||
    `${type.replace(/_/g, "-")}-${document.number || document._id}.pdf`;

  let attachments:
    | { filename: string; content: Buffer; contentType?: string }[]
    | undefined;

  if (attachPdf) {
    const pdfBuffer = await generateDocumentPdfBuffer(pdfType, payload.id, user);
    attachments = [
      {
        filename: pdfFileName.endsWith(".pdf") ? pdfFileName : `${pdfFileName}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ];
  }

  await sendDocumentMail({
    fromDisplayName,
    to,
    cc,
    bcc,
    subject,
    html: body,
    attachments,
  });

  const Model = getDocumentModel(pdfType);
  const updated = await Model.findOneAndUpdate(
    { _id: payload.id, user_id: user._id, isDeleted: false },
    { $set: payload.document_update },
    { new: true, runValidators: true },
  ).lean();

  if (!updated) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Email sent but document update failed — document not found",
    );
  }

  return {
    type,
    id: payload.id,
    email_sent: true,
    pdf_attached: attachPdf,
    document: updated,
  };
};

export const documentEmailService = { prepareDB, sendDB };
