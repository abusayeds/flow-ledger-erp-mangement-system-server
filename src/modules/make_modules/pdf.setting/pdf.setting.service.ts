import { IPDFSetting, PDFSettingModel } from "./pdf.setting.model";
import { TPDFSetting } from "./pdf.setting.interface";
import AppError from "../../../errors/AppError";
import httpStatus from "http-status";
import { pdfSettingSeedDefaults } from "../../../utils/seed/seed.pdfSetting";
import { validatePdfSettingEnums } from "./pdf.setting.enumValidation";

const PdfSettingCreateDB = async (payload: TPDFSetting): Promise<IPDFSetting> => {
   const isExist  =  await PDFSettingModel.findOne({ user_id: payload.user_id , pdfType : payload.pdfType}) 
   if(isExist) { throw new AppError(httpStatus.BAD_REQUEST , "alredy added") }
  const result = await PDFSettingModel.create(payload);
  return result;
};

const PdfSettingUpdateDB = async (
  pdfType: string,
  payload: Partial<TPDFSetting>, 
  user_id : string
): Promise<IPDFSetting | null> => {
   const isExist  =  await PDFSettingModel.findOne({pdfType , user_id : user_id}) 

   if(!pdfType) { throw new AppError(httpStatus.BAD_REQUEST , "pdfType is required !") }
   if(!isExist) { throw new AppError(httpStatus.BAD_REQUEST , "PDF Setting not found") }
  validatePdfSettingEnums(payload as Record<string, unknown>);
  const result = await PDFSettingModel.findOneAndUpdate({ pdfType, user_id }, payload, {
    new: true,
    runValidators: true
  });
  return result;
};

const PdfSettingGetDB = async (pdfType: string, user_id: string) => {
  if (!pdfType) {
    throw new AppError(httpStatus.BAD_REQUEST, "pdfType is required !");
  }
   if(pdfType === "all") {
    const result = await PDFSettingModel.find({ user_id }).lean();
    return result;
   } else {
    const result = await PDFSettingModel.findOne({ pdfType, user_id }).lean();
    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, "PDF Setting not found");
    }
    return result;
   }
};

// Reset a pdfType's setting back to the seed defaults (same values seeded on login).
const PdfSettingResetDB = async (pdfType: string, user_id: string) => {
  if (!pdfType) {
    throw new AppError(httpStatus.BAD_REQUEST, "pdfType is required !");
  }
  const result = await PDFSettingModel.findOneAndUpdate(
    { pdfType, user_id },
    { $set: { ...pdfSettingSeedDefaults } },
    { new: true, upsert: true, runValidators: true }
  );
  return result;
};

export const pdfSettingService = {
  PdfSettingCreateDB,
  PdfSettingUpdateDB,
  PdfSettingGetDB,
  PdfSettingResetDB,
};