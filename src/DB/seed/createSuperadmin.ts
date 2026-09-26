/**
 * One-time seed: create (or reset) the first super admin account.
 *
 * Run:  npm run seed:superadmin
 * Env (optional overrides):
 *   SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, SUPERADMIN_NAME
 *
 * Defaults: superadmin@qyad.app / SuperAdmin@123
 * The User schema hashes `password` automatically via its setter.
 */
import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import "../mongoosePlugins";
import { connectMigrationMongo } from "../migrations/connectMongo";
import { UserModel } from "../../modules/basic_modules/user/user.model";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const EMAIL = (process.env.SUPERADMIN_EMAIL || "superadmin@qyad.app").toLowerCase();
const PASSWORD = process.env.SUPERADMIN_PASSWORD || "SuperAdmin@123";
const NAME = process.env.SUPERADMIN_NAME || "Super Admin";

async function run() {
  await connectMigrationMongo();

  const existing = await UserModel.findOne({ email: EMAIL });
  if (existing) {
    existing.role = "superadmin" as typeof existing.role;
    existing.status = "active";
    existing.login = true;
    existing.isDeleted = false;
    existing.authProvider = "local" as typeof existing.authProvider;
    existing.password = PASSWORD; // re-hashed by setter
    await existing.save();
    console.log(`✔ Updated existing account to super admin: ${EMAIL}`);
  } else {
    await UserModel.create({
      name: NAME,
      email: EMAIL,
      password: PASSWORD, // hashed by schema setter
      role: "superadmin",
      status: "active",
      active: true,
      login: true,
      authProvider: "local",
    });
    console.log(`✔ Created super admin: ${EMAIL}`);
  }

  console.log("─────────────────────────────────────");
  console.log(`  Email:    ${EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log("  Login via POST /api/v1/user/login");
  console.log("─────────────────────────────────────");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
