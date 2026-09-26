// /**
//  * One-time migration: backfill Tax.type on legacy records.
//  *
//  * Run: npm run migrate:tax-type
//  */
// import dotenv from "dotenv";
// import path from "path";
// import mongoose, { Types } from "mongoose";
// import "../mongoosePlugins";
// import { TaxModel } from "../../modules/make_modules/product/tax/tax.model";
// import { ProductModel } from "../../modules/make_modules/product/product.model";
// import { UserModel } from "../../modules/basic_modules/user/user.model";
// import { TAX_TYPES, TTaxType } from "../../modules/make_modules/product/tax/tax.interface";

// dotenv.config({ path: path.join(process.cwd(), ".env") });

// const collectReferencedTaxIds = async () => {
//   const productTaxIds = new Set<string>(
//     (await ProductModel.distinct("tax", { tax: { $ne: null } })).map(String)
//   );

//   const serviceDefaultIds = new Set<string>();
//   const productDefaultIds = new Set<string>();
//   const users = await UserModel.find({
//     $or: [
//       { "businessProfile.default_tax_service_id": { $exists: true, $ne: null } },
//       { "businessProfile.default_tax_product_id": { $exists: true, $ne: null } },
//     ],
//   }).select("businessProfile.default_tax_service_id businessProfile.default_tax_product_id");

//   for (const user of users) {
//     const serviceId = user.businessProfile?.default_tax_service_id;
//     const productId = user.businessProfile?.default_tax_product_id;
//     if (serviceId) serviceDefaultIds.add(String(serviceId));
//     if (productId) productDefaultIds.add(String(productId));
//   }

//   return { productTaxIds, serviceDefaultIds, productDefaultIds };
// };

// const inferTaxType = (
//   taxId: Types.ObjectId | string,
//   refs: {
//     productTaxIds: Set<string>;
//     serviceDefaultIds: Set<string>;
//     productDefaultIds: Set<string>;
//   }
// ): TTaxType => {
//   const id = String(taxId);
//   const usedForProduct = refs.productTaxIds.has(id) || refs.productDefaultIds.has(id);
//   const usedForService = refs.serviceDefaultIds.has(id);
//   if (usedForProduct && usedForService) return "both";
//   if (usedForService) return "service";
//   return "product";
// };

// async function migrateTaxType() {
//   const databaseUrl = process.env.DATABASE_URL;
//   if (!databaseUrl) {
//     throw new Error("DATABASE_URL is not set in .env");
//   }

//   await mongoose.connect(databaseUrl);
//   console.log("MongoDB connected — starting tax type migration...\n");

//   const refs = await collectReferencedTaxIds();
//   const legacyTaxes = await TaxModel.find({
//     $or: [{ type: { $exists: false } }, { type: null }, { type: { $nin: [...TAX_TYPES] } }],
//   });

//   let backfilled = 0;
//   for (const tax of legacyTaxes) {
//     const type = inferTaxType(tax._id as Types.ObjectId, refs);
//     await TaxModel.updateOne({ _id: tax._id }, { $set: { type } });
//     backfilled += 1;
//     console.log(`  backfill: ${tax.name} (${tax.rate}%) → ${type}`);
//   }

//   const summary = await TaxModel.aggregate([
//     { $group: { _id: "$type", count: { $sum: 1 } } },
//     { $sort: { _id: 1 } },
//   ]);

//   console.log("\n--- Migration complete ---");
//   console.log(`Legacy taxes backfilled: ${backfilled}`);
//   console.log("Tax counts by type:", summary);

//   await mongoose.disconnect();
// }

// migrateTaxType().catch(async (error) => {
//   console.error("Tax migration failed:", error);
//   await mongoose.disconnect().catch(() => undefined);
//   process.exit(1);
// });
