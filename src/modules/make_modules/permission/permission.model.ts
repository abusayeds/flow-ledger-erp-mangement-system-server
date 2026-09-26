import mongoose, { Schema } from "mongoose";
import { TPermission } from "./permission.interface";

const permissionSchema = new Schema<TPermission>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    // Free-form so companies can define custom roles (not just the base enum).
    // Reserved names (superadmin/company) are blocked in the service layer.
    role: {
      type: String,
      required: true,
      trim: true,
    },
    permissions: [{ type: String }],
    isActive: {
      type: Boolean,
      default: true,
    },
    label: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);
permissionSchema.index({ companyId: 1, role: 1 }, { unique: true });

export const PermissionModel = mongoose.model<TPermission>(
  "Permission",
  permissionSchema,
);
