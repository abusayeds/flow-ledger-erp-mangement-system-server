import { Types } from "mongoose";

// Key-value store for portal config (brand, title/cta sections, support/contact info, toggles…).
export interface TSupportSetting {
  _id?: string;
  user_id?: Types.ObjectId;
  key: string;
  value?: unknown;
}
