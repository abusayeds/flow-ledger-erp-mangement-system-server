import mongoose from "mongoose";
import { applySoftDeleteFields } from "./softDeleteSchema";

/**
 * Ensures schema enum/required validators run on all update queries app-wide.
 * Without this, findOneAndUpdate/updateOne accept invalid enum values (e.g. status).
 */
function enableRunValidators(this: mongoose.Query<unknown, unknown>) {
  const opts = this.getOptions();
  if (opts.runValidators === true) return;
  this.setOptions({ ...opts, runValidators: true, context: "query" });
}

mongoose.plugin((schema) => {
  schema.pre("findOneAndUpdate", enableRunValidators);
  schema.pre("updateOne", enableRunValidators);
  schema.pre("updateMany", enableRunValidators);

  applySoftDeleteFields(schema);
});
