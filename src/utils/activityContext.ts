import { Types } from "mongoose";
import { AuthRequest } from "../middlewares/auth";

export const activityActors = (req: AuthRequest) => ({
  user_id: req.user?._id as Types.ObjectId,
  actor_id: req.user?._id as Types.ObjectId,
});
