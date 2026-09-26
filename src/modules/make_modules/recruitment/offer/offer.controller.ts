import httpStatus from "http-status";
import { AuthRequest } from "../../../../middlewares/auth";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { offerService } from "./offer.service";

const create = catchAsync(async (req: AuthRequest, res) => {
  const result = await offerService.create(req, req.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Offer created successfully", data: result });
});

const getAll = catchAsync(async (req: AuthRequest, res) => {
  const result = await offerService.list(req, req.query as Record<string, unknown>);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Offers retrieved successfully", data: result.data, pagination: result.pagination });
});

const getSingle = catchAsync(async (req: AuthRequest, res) => {
  const result = await offerService.single(req, req.params.id);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Offer retrieved successfully", data: result });
});

const update = catchAsync(async (req: AuthRequest, res) => {
  const result = await offerService.update(req, req.params.id, req.body);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Offer updated successfully", data: result });
});

const updateApprovalStatus = catchAsync(async (req: AuthRequest, res) => {
  const result = await offerService.updateApprovalStatus(req, req.params.id, req.body.approval_status);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Offer approval status updated", data: result });
});

const sendEmail = catchAsync(async (req: AuthRequest, res) => {
  const result = await offerService.sendEmail(req, req.params.id);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Offer letter email sent", data: result });
});

const downloadOfferLetter = catchAsync(async (req: AuthRequest, res) => {
  const result = await offerService.downloadOfferLetter(req, req.params.id);

  if (req.query.format === "html" && result.html) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename="${result.filename}"`);
    return res.status(httpStatus.OK).send(result.html);
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Offer letter retrieved successfully",
    data: result,
  });
});

const convertToEmployee = catchAsync(async (req: AuthRequest, res) => {
  const result = await offerService.convertToEmployee(req, req.params.id, req.body);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Offer converted to employee successfully", data: result });
});

const remove = catchAsync(async (req: AuthRequest, res) => {
  await offerService.remove(req, req.params.id);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Offer deleted successfully", data: null });
});

export const offerController = {
  create,
  getAll,
  getSingle,
  update,
  updateApprovalStatus,
  sendEmail,
  downloadOfferLetter,
  convertToEmployee,
  remove,
};
