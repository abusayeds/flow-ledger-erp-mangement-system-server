import httpStatus from "http-status";
import { AuthRequest } from "../../../middlewares/auth";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { IUser } from "../../basic_modules/user/user.interface";
import { documentEmailService } from "./documentEmail.service";
import { TDocumentEmailSendBody } from "./documentEmail.interface";

const prepare = catchAsync(async (req: AuthRequest, res) => {
  const type = String(req.query.type || "");
  const id = String(req.query.id || "");
  const result = await documentEmailService.prepareDB(req.user as IUser, type, id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Document email prepared successfully.",
    data: result,
  });
});

const send = catchAsync(async (req: AuthRequest, res) => {
  const result = await documentEmailService.sendDB(
    req.user as IUser,
    req.body as TDocumentEmailSendBody,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Document email sent successfully.",
    data: result,
  });
});

export const documentEmailController = { prepare, send };
