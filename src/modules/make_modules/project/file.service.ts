/* eslint-disable no-unused-vars */
import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../errors/AppError";
import { ProjectFileModel } from "./project.model";
import { TProjectFile } from "./project.interface";
import {
  assertProject,
  companyObjectId,
  fileUrl,
  formatProjectResponse,
  logProjectActivity,
} from "./project.utils";
import { UPLOAD_URL_PREFIX } from "../../../middlewares/fileUploadNormal";
import { withBulkDeleteIdSecond } from "../../../utils/bulkDelete";

type ReqLite = { protocol: string; get: (n: string) => string | undefined };
type FileDoc = TProjectFile & { _id: Types.ObjectId; createdAt?: Date };
/** Minimal shape of a multer-parsed upload (avoids the global Express.Multer type). */
export type UploadedFile = { originalname: string; filename: string };

const shapeFile = (f: FileDoc, req?: ReqLite) => ({
  _id: f._id,
  project_id: f.project_id,
  file_name: f.file_name,
  file_path: f.file_path,
  url: req ? fileUrl(req, f.file_path) : f.file_path,
  createdAt: f.createdAt,
});

/** Attach one or more uploaded files to a project (Laravel ProjectController@storeFiles). */
const upload = async (
  userId: string,
  projectId: string,
  files: UploadedFile[],
  req?: ReqLite
) => {
  await assertProject(projectId, userId);
  if (!files?.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "No files uploaded");
  }
  const companyOid = companyObjectId(userId);
  const projectOid = new Types.ObjectId(projectId);

  const docs = (await ProjectFileModel.insertMany(
    files.map((f) => ({
      user_id: companyOid,
      project_id: projectOid,
      file_name: f.originalname,
      file_path: `${UPLOAD_URL_PREFIX}/${f.filename}`,
      isDeleted: false,
    }))
  )) as unknown as FileDoc[];

  for (const d of docs) {
    await logProjectActivity(companyOid, projectOid, "Upload File", { file_name: d.file_name });
  }
  return formatProjectResponse(docs.map((d) => shapeFile(d, req)));
};

const listByProject = async (userId: string, projectId: string, req?: ReqLite) => {
  await assertProject(projectId, userId);
  const items = (await ProjectFileModel.find({
    project_id: projectId,
    user_id: userId,
    isDeleted: false,
  }).sort({ createdAt: -1 })) as unknown as FileDoc[];
  return formatProjectResponse(items.map((f) => shapeFile(f, req)));
};

const removeOne = async (userId: string, fileId: string) => {
  const file = (await ProjectFileModel.findOneAndUpdate(
    { _id: fileId, user_id: userId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  )) as unknown as FileDoc | null;
  if (!file) throw new AppError(httpStatus.NOT_FOUND, "File not found");
  return formatProjectResponse(shapeFile(file));
};

const remove = withBulkDeleteIdSecond(removeOne);

export const fileService = { upload, listByProject, remove };
