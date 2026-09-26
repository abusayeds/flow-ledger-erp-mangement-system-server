import { Schema } from "mongoose";

/** Standard soft-delete flags — default false on every create. */
export const softDeleteSchemaFields = {
  isDeleted: { type: Boolean, default: false },
  isArchive: { type: Boolean, default: false },
} as const;

export type TSoftDeleteFields = {
  isDeleted?: boolean;
  isArchive?: boolean;
};

/** Append to a Schema definition object when defining inline schemas. */
export const withSoftDeleteFields = <T extends Record<string, unknown>>(fields: T) => ({
  ...fields,
  ...softDeleteSchemaFields,
});

/** Apply standard soft-delete paths when missing from a compiled schema. */
export const applySoftDeleteFields = (schema: Schema) => {
  if (!schema.path("isDeleted")) {
    schema.add({ isDeleted: softDeleteSchemaFields.isDeleted });
  }
  if (!schema.path("isArchive")) {
    schema.add({ isArchive: softDeleteSchemaFields.isArchive });
  }
};
