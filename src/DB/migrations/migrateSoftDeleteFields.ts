/**
 * One-time migration: rename legacy `archive` -> `isArchive` and backfill missing soft-delete flags.
 *
 * Run: npm run migrate:soft-delete-fields
 *
 * Optional .env fallback when SRV DNS fails:
 * DATABASE_URL_STANDARD=mongodb://user:pass@host1:27017,.../invoice?ssl=true&authSource=admin
 */
import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import "../mongoosePlugins";
import { connectMigrationMongo } from "./connectMongo";

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function migrateCollection(collectionName: string) {
  const collection = mongoose.connection.collection(collectionName);
  const exists = (await mongoose.connection.db!.listCollections({ name: collectionName }).toArray()).length > 0;
  if (!exists) {
    return { collectionName, renamed: 0, profileRenamed: 0, backfilledDeleted: 0, backfilledArchive: 0 };
  }

  const renameResult = await collection.updateMany({ archive: { $exists: true } }, [
    { $set: { isArchive: "$archive" } },
    { $unset: "archive" },
  ]);

  const profileRename = await collection.updateMany(
    { "businessProfile.archive": { $exists: true } },
    [
      { $set: { "businessProfile.isArchive": "$businessProfile.archive" } },
      { $unset: "businessProfile.archive" },
    ]
  );

  const backfillDeleted = await collection.updateMany(
    { isDeleted: { $exists: false } },
    { $set: { isDeleted: false } }
  );

  const backfillArchive = await collection.updateMany(
    { isArchive: { $exists: false } },
    { $set: { isArchive: false } }
  );

  return {
    collectionName,
    renamed: renameResult.modifiedCount,
    profileRenamed: profileRename.modifiedCount,
    backfilledDeleted: backfillDeleted.modifiedCount,
    backfilledArchive: backfillArchive.modifiedCount,
  };
}

async function main() {
  await connectMigrationMongo();
  console.log("MongoDB connected — soft-delete field migration...\n");

  const collections = await mongoose.connection.db!.listCollections().toArray();
  const totals = { renamed: 0, profileRenamed: 0, backfilledDeleted: 0, backfilledArchive: 0 };

  for (const { name } of collections) {
    if (name.startsWith("system.")) continue;
    const result = await migrateCollection(name);
    totals.renamed += result.renamed;
    totals.profileRenamed += result.profileRenamed;
    totals.backfilledDeleted += result.backfilledDeleted;
    totals.backfilledArchive += result.backfilledArchive;
    if (
      result.renamed ||
      result.profileRenamed ||
      result.backfilledDeleted ||
      result.backfilledArchive
    ) {
      console.log(result);
    }
  }

  console.log("\n--- Migration complete ---");
  console.log(totals);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Soft-delete migration failed:", error);
  if (String(error).includes("querySrv") || String(error).includes("ECONNREFUSED")) {
    console.error(
      "\nTip: Add Atlas 'Standard connection string' to .env as DATABASE_URL_STANDARD= mongodb://..."
    );
  }
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
