import nodemailer from "nodemailer";
import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import { Nodemailer_GMAIL, Nodemailer_GMAIL_PASSWORD } from "../../../../config";

export type TMailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type TSendDocumentMailInput = {
  /** Display name only — real address is always fixed Gmail. */
  fromDisplayName?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  attachments?: TMailAttachment[];
};

const buildFrom = (displayName?: string) => {
  const address = Nodemailer_GMAIL;
  if (!address) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Email SMTP is not configured");
  }
  const name = (displayName || "").trim();
  if (!name) return address;
  const safe = name.replace(/"/g, "");
  return `"${safe}" <${address}>`;
};

/** Send HTML email via fixed Gmail SMTP, optional PDF attachment. */
export const sendDocumentMail = async (input: TSendDocumentMailInput) => {
  if (!Nodemailer_GMAIL || !Nodemailer_GMAIL_PASSWORD) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Email SMTP is not configured");
  }
  if (!input.to?.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "At least one recipient (to) is required");
  }
  if (!input.subject?.trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, "subject is required");
  }
  if (!input.html?.trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, "body is required");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    auth: {
      user: Nodemailer_GMAIL,
      pass: Nodemailer_GMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: buildFrom(input.fromDisplayName),
    to: input.to.join(", "),
    cc: input.cc?.length ? input.cc.join(", ") : undefined,
    bcc: input.bcc?.length ? input.bcc.join(", ") : undefined,
    subject: input.subject,
    html: input.html,
    attachments: (input.attachments || []).map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType || "application/pdf",
    })),
  });
};
