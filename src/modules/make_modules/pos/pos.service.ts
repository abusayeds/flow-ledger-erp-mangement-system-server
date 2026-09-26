/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuthRequest } from "../../../middlewares/auth";
import { companyObjectId, resolveCompanyId } from "../dashboard/dashboard.utils";
import { SalesReceiptModel } from "../salesReceipt/salesReceipt.model";
import { ProductModel } from "../product/product.model";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const lineAmount = (p: any): number =>
  Number(p.amount) || (Number(p.quantity) || 0) * (Number(p.rate) || 0);

const getDashboard = async (req: AuthRequest) => {
  const companyId = resolveCompanyId(req);
  const scope = { user_id: companyObjectId(companyId) };

  const receipts = await SalesReceiptModel.find(scope).lean();

  const totalSales = receipts.reduce((s, r: any) => s + (r.total || 0), 0);
  const totalOrders = receipts.length;
  const itemsSold = receipts.reduce(
    (s, r: any) => s + (r.product || []).reduce((a: number, p: any) => a + (p.quantity || 0), 0),
    0,
  );
  const avgOrderValue = totalOrders ? totalSales / totalOrders : 0;

  // Sales by day of week.
  const byDay: Record<string, { sales: number; orders: number }> = Object.fromEntries(
    WEEK_ORDER.map((d) => [d, { sales: 0, orders: 0 }]),
  );
  for (const r of receipts as any[]) {
    const dt = r.date || r.createdAt;
    if (!dt) continue;
    const day = DOW[new Date(dt).getDay()];
    byDay[day].sales += r.total || 0;
    byDay[day].orders += 1;
  }
  const salesByDay = WEEK_ORDER.map((label) => ({
    label,
    sales: byDay[label].sales,
    orders: byDay[label].orders,
  }));

  // Payment-method distribution.
  const pmMap = new Map<string, number>();
  for (const r of receipts as any[]) {
    const methods = r.payment_method?.length ? r.payment_method : ["Cash"];
    for (const m of methods) pmMap.set(m, (pmMap.get(m) || 0) + 1);
  }
  const paymentMethods = [...pmMap.entries()].map(([name, count]) => ({ name, count }));

  // Aggregate product lines.
  const prodAgg = new Map<
    string,
    { name: string; product_id: any; revenue: number; sold: number }
  >();
  for (const r of receipts as any[]) {
    for (const p of r.product || []) {
      const key = String(p.product_id || p.product_name || "unknown");
      const e =
        prodAgg.get(key) ||
        { name: p.product_name || "Product", product_id: p.product_id, revenue: 0, sold: 0 };
      e.revenue += lineAmount(p);
      e.sold += p.quantity || 0;
      prodAgg.set(key, e);
    }
  }

  // Resolve categories for the aggregated products.
  const productIds = [...prodAgg.values()].map((e) => e.product_id).filter(Boolean);
  const products = productIds.length
    ? await ProductModel.find({ _id: { $in: productIds } })
        .populate("category", "name")
        .select("productName category")
        .lean()
    : [];
  const catByProduct = new Map<string, string>();
  for (const pr of products as any[]) {
    catByProduct.set(String(pr._id), pr.category?.name || "Uncategorized");
  }
  const categoryOf = (productId: any): string =>
    productId ? catByProduct.get(String(productId)) || "Uncategorized" : "Uncategorized";

  const topProducts = [...prodAgg.values()]
    .map((e) => ({
      name: e.name,
      category: categoryOf(e.product_id),
      sold: e.sold,
      revenue: e.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const catMap = new Map<string, number>();
  for (const e of prodAgg.values()) {
    const cat = categoryOf(e.product_id);
    catMap.set(cat, (catMap.get(cat) || 0) + e.revenue);
  }
  const salesByCategory = [...catMap.entries()].map(([name, value]) => ({ name, value }));

  const recentTransactions = [...(receipts as any[])]
    .sort(
      (a, b) =>
        new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime(),
    )
    .slice(0, 10)
    .map((r) => ({
      id: String(r._id),
      customer: r.customer_name || "Walk-in",
      amount: r.total || 0,
      method: (r.payment_method && r.payment_method[0]) || "Cash",
      status: r.status || "completed",
      date: r.date || r.createdAt,
    }));

  return {
    stats: { totalSales, totalOrders, avgOrderValue, itemsSold },
    salesByDay,
    salesByCategory,
    topProducts,
    paymentMethods,
    recentTransactions,
  };
};

export const posService = { getDashboard };
