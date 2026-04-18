import type { AnalyticsOrder, DailyStats } from "./types";

export function computeMetrics(orders: AnalyticsOrder[]) {
  return {
    totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    totalOrders: orders.length,
    avgOrderValue:
      orders.length > 0
        ? orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / orders.length
        : 0,
    totalPaid: orders.reduce((sum, o) => sum + (o.paidAmount || o.totalAmount || 0), 0),
    completedOrders: orders.filter((o) => o.status === "completed" || o.status === "COMPLETED").length,
    pendingOrders: orders.filter((o) => o.status === "pending" || o.status === "PENDING").length,
    activeCustomers: new Set(
      orders.map((o) => (o as unknown as { userId?: unknown; customerId?: unknown }).userId ?? (o as unknown as { customerId?: unknown }).customerId)
    ).size,
  };
}

export function computeStatusDistribution(orders: AnalyticsOrder[]): Record<string, number> {
  return {
    pending: orders.filter((o) => o.status?.toLowerCase() === "pending").length,
    approved: orders.filter((o) => o.status?.toLowerCase() === "approved").length,
    production: orders.filter((o) => o.status?.toLowerCase() === "production").length,
    ready: orders.filter((o) => o.status?.toLowerCase() === "ready").length,
    completed: orders.filter((o) => o.status?.toLowerCase() === "completed").length,
    cancelled: orders.filter((o) => o.status?.toLowerCase() === "cancelled").length,
  };
}

export function computeTopProducts(orders: AnalyticsOrder[]) {
  const productStats: Record<string, { quantity: number; revenue: number }> = {};
  orders.forEach((order) => {
    if (Array.isArray(order.items)) {
      order.items.forEach((item: unknown) => {
        const it = item as Record<string, unknown>;
        const name = String(it.productName || it.name || "Unknown");
        if (!productStats[name]) {
          productStats[name] = { quantity: 0, revenue: 0 };
        }
        productStats[name].quantity += Number(it.quantity) || 1;
        productStats[name].revenue += Number(it.lineTotal || it.totalPrice || it.unitPrice) || 0;
      });
    }
  });
  return Object.entries(productStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

export function computeTopCustomers(orders: AnalyticsOrder[]) {
  const customerStats: Record<string, { name: string; orders: number; revenue: number }> = {};
  orders.forEach((order) => {
    const o = order as unknown as { userId?: unknown; customerId?: unknown; userFullName?: string; customerName?: string };
    const customerId = String(o.userId || o.customerId || "unknown");
    if (!customerStats[customerId]) {
      customerStats[customerId] = {
        name: o.userFullName || o.customerName || "Naməlum",
        orders: 0,
        revenue: 0,
      };
    }
    customerStats[customerId].orders += 1;
    customerStats[customerId].revenue += order.totalAmount || 0;
  });
  return Object.entries(customerStats)
    .map(([id, stats]) => ({ id, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

export function maxDailyRevenue(dailyStats: DailyStats[]): number {
  return dailyStats.length > 0 ? Math.max(...dailyStats.map((s) => s.revenue), 1) : 1;
}
