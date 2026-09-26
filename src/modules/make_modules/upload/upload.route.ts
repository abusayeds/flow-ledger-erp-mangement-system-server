import express, { Response } from "express";
import httpStatus from "http-status";
import AppError from "../../../errors/AppError";
import { authMiddleware, AuthRequest } from "../../../middlewares/auth";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import upload, { UPLOAD_URL_PREFIX } from "../../../middlewares/fileUploadNormal";
import { role } from "../../../utils/role";

const router = express.Router();

/**
 * Generic attachment upload.
 *
 * Documents that carry a single attachment (bill, debit note, expense, payment)
 * had nowhere to send a picked file — the app kept it in screen state and it was
 * lost on navigation. This stores the file with the same multer pipeline
 * projects already use (uuid filename, extension allow-list, size cap) and
 * returns a URL the caller saves on the document's `attachments` field.
 *
 * `express.static("public")` serves the folder, so the returned path is directly
 * fetchable.
 */
const uploadFiles = catchAsync(async (req: AuthRequest, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "No file uploaded");
  }

  const absolute = (p: string) => `${req.protocol}://${req.get("host")}${p}`;

  const data = files.map((f) => {
    const filePath = `${UPLOAD_URL_PREFIX}/${f.filename}`;
    return {
      file_name: f.originalname,
      file_path: filePath,
      // Both forms: `url` for immediate display, `file_path` to persist so the
      // stored value survives a host/scheme change.
      url: absolute(filePath),
      size: f.size,
      mime_type: f.mimetype,
    };
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "File uploaded successfully.",
    // Single upload returns the object directly; multiple returns the array.
    data: data.length === 1 ? data[0] : data,
  });
});

router.post(
  "/",
  authMiddleware(role.company),
  upload.array("files"),
  uploadFiles
);

export const uploadRoutes = router;
