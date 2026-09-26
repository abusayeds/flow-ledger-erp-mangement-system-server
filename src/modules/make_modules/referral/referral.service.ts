import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../../errors/AppError";
import { ReferralModel } from "./referral.model";

const uid = (id: string) => new Types.ObjectId(id);

const createDB = async (userId: string, email: string) => {
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    throw new AppError(httpStatus.BAD_REQUEST, "A valid email address is required");
  }
  return ReferralModel.create({ user_id: uid(userId), email: email.trim(), status: "Sent" });
};

const getAllDB = async (userId: string) =>
  ReferralModel.find({ user_id: uid(userId), isDeleted: { $ne: true } })
    .sort({ createdAt: -1 })
    .lean();

export const referralService = { createDB, getAllDB };
