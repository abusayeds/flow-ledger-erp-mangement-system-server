import { AuthRequest } from "../../../../middlewares/auth";
import { companyScope, resolveCompanyId } from "../shared/support.utils";
import { TicketModel } from "../ticket/ticket.model";
import { TicketCategoryModel } from "../ticketCategory/ticketCategory.model";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PALETTE = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4"];
const initials = (n: string) =>
  (n || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("") || "?";

const getDashboard = async (req: AuthRequest) => {
  const companyId = resolveCompanyId(req);
  const scope = { ...companyScope(companyId), isDeleted: { $ne: true } };

  const [tickets, categories] = await Promise.all([
    TicketModel.find(scope)
      .populate("category", "name")
      .select("ticket_id subject name status category createdAt")
      .lean(),
    TicketCategoryModel.find({ ...companyScope(companyId), isDeleted: { $ne: true } })
      .select("name")
      .lean(),
  ]);

  const tk = tickets as any[];
  const total = tk.length;
  const countStatus = (s: string) => tk.filter((t) => t.status === s).length;
  const closed = countStatus("Closed");

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todaysTickets = tk.filter((t) => t.createdAt && new Date(t.createdAt) >= startOfToday).length;

  const statCards = [
    { title: "Total Tickets", value: String(total), subtitle: "All time", color: "blue" },
    {
      title: "Open Tickets",
      value: String(countStatus("In Progress") + countStatus("On Hold")),
      subtitle: "Pending resolution",
      color: "yellow",
    },
    {
      title: "Closed Tickets",
      value: String(closed),
      subtitle: `${total ? Math.round((closed / total) * 100) : 0}% resolution rate`,
      color: "green",
    },
    { title: "Today's Tickets", value: String(todaysTickets), subtitle: "Created today", color: "purple" },
    { title: "Avg Response", value: "—", subtitle: "Response time", color: "orange" },
    { title: "Categories", value: String(categories.length), subtitle: "Active categories", color: "indigo" },
  ];

  // Status distribution (backend statuses + an always-zero "Open" for the UI legend).
  const statusDistribution = [
    { name: "Closed", value: closed, color: "#10B981" },
    { name: "In Progress", value: countStatus("In Progress"), color: "#3B82F6" },
    { name: "On Hold", value: countStatus("On Hold"), color: "#F59E0B" },
    { name: "Open", value: 0, color: "#EF4444" },
  ];

  // Category distribution.
  const catCount = new Map<string, number>();
  for (const t of tk) {
    const nm = t.category?.name || "Uncategorized";
    catCount.set(nm, (catCount.get(nm) || 0) + 1);
  }
  const categoryDistribution = [...catCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count], i) => ({ name, count, color: PALETTE[i % PALETTE.length] }));

  // Ticket trends by month (current calendar year).
  const year = new Date().getFullYear();
  const trend = MONTHS.map((month) => ({ month, tickets: 0, resolved: 0 }));
  for (const t of tk) {
    if (!t.createdAt) continue;
    const dt = new Date(t.createdAt);
    if (dt.getFullYear() !== year) continue;
    trend[dt.getMonth()].tickets += 1;
    if (t.status === "Closed") trend[dt.getMonth()].resolved += 1;
  }

  // Recent tickets.
  const recentTickets = [...tk]
    .sort((a, b) => +new Date(b.createdAt || 0) - +new Date(a.createdAt || 0))
    .slice(0, 6)
    .map((t) => {
      const dt = t.createdAt ? new Date(t.createdAt) : null;
      const customer = t.name || "—";
      return {
        id: t.ticket_id ? `#${t.ticket_id}` : String(t._id),
        title: t.subject || "—",
        customer,
        category: t.category?.name || "—",
        status: t.status || "In Progress",
        priority: "Medium",
        date: dt ? dt.toISOString().slice(0, 10) : "",
        time: dt ? dt.toISOString().slice(11, 16) : "",
        avatar: initials(customer),
      };
    });

  return {
    statCards,
    ticketTrends: trend,
    statusDistribution,
    categoryDistribution,
    recentTickets,
    stats: { total, open: countStatus("In Progress") + countStatus("On Hold"), closed, today: todaysTickets },
  };
};

export const supportDashboardService = { getDashboard };
