import { UserModel } from "../modules/basic_modules/user/user.model";
import { PlanModel } from "../modules/make_modules/subscription/plan/plan.model";
import { TPlan } from "../modules/make_modules/subscription/plan/plan.interface";
import { MODULE_KEYS, UNLIMITED } from "../modules/make_modules/subscription/subscription.constants";
import { role } from "../utils/role";

type TSeedPlan = Omit<TPlan, "_id" | "created_by" | "isDeleted" | "createdAt" | "updatedAt">;

// Default subscription plans. Only missing plans (matched by name) are created,
// so edits made by the super admin are never overwritten on restart.
const defaultPlans: TSeedPlan[] = [
  {
    name: "Free",
    description: "Get started with the basics — invoicing, quotations and proposals.",
    price_monthly: 0,
    price_yearly: 0,
    free_plan: true,
    trial: false,
    trial_days: 0,
    status: true,
    number_of_users: 1,
    limits: {},
    modules: ["account", "quotation", "proposal"],
  },
  {
    name: "Starter",
    description: "All modules for small teams.",
    price_monthly: 120,
    price_yearly: 1200,
    free_plan: false,
    trial: true,
    trial_days: 14,
    status: true,
    number_of_users: 5,
    limits: {},
    modules: [...MODULE_KEYS],
  },
  {
    name: "Pro",
    description: "All modules with unlimited users for growing businesses.",
    price_monthly: 299,
    price_yearly: 2990,
    free_plan: false,
    trial: true,
    trial_days: 14,
    status: true,
    number_of_users: UNLIMITED,
    limits: {},
    modules: [...MODULE_KEYS],
  },
];

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const seedPlans = async () => {
  const superAdmin = await UserModel.findOne({ role: role.superadmin }).select("_id");

  for (const plan of defaultPlans) {
    const exists = await PlanModel.exists({
      name: { $regex: `^${escapeRegex(plan.name)}$`, $options: "i" },
      isDeleted: false,
    });
    if (exists) continue;

    await PlanModel.create({ ...plan, created_by: superAdmin?._id, isDeleted: false });
    console.log(`Seeded subscription plan: ${plan.name}`);
  }
};

export default seedPlans;
