/**
 * Backfill the subscription-payment ledger from existing priced subscriptions so the
 * super admin has payment history to view/refund. Idempotent: skips a company that
 * already has a payment record. These are marked source "legacy" (no Stripe intent),
 * so refunds against them are recorded manually (no Stripe call).
 *
 * Run: npm run seed:backfill-payments
 */
import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import "../mongoosePlugins";
import { connectMigrationMongo } from "../migrations/connectMongo";
import { CompanySubscriptionModel } from "../../modules/make_modules/subscription/companySubscription/companySubscription.model";
import { SubscriptionPaymentModel } from "../../modules/make_modules/subscription/subscriptionPayment/subscriptionPayment.model";

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function run() {
  await connectMigrationMongo();

  const subs = await CompanySubscriptionModel.find({ price: { $gt: 0 } }).lean();
  let created = 0;
  let skipped = 0;

  for (const s of subs as any[]) {
    const exists = await SubscriptionPaymentModel.exists({ company_id: s.company_id });
    if (exists) {
      skipped++;
      continue;
    }
    await SubscriptionPaymentModel.create({
      company_id: s.company_id,
      plan_id: s.plan_id,
      plan_name: s.plan_name || "Subscription",
      amount: s.price || 0,
      currency: "usd",
      billing_cycle: s.billing_cycle,
      status: "paid",
      source: "legacy",
      paid_at: s.start_date || s.createdAt || new Date(),
    });
    created++;
  }

  console.log(`✔ Backfill complete — created ${created}, skipped ${skipped} (already had a payment).`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
