"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, 
  Package, Calendar, Download, ArrowUpRight, ArrowDownRight
} from "lucide-react";

interface Order {
  id: number;
  orderNumber: string;
  userId?: number;
  userFullName?: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  createdAt: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface User {
  id: string;
  fullName: string;
  username: string;
  totalOrders?: number;
  totalSales?: number;
}

interface DailyStats {
  date: string;
  revenue: number;
  orders: number;
}

export default function AnalyticsDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      // Загрузка заказов
      const ordersRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://premium-reklam-backend.onrender.com"}/api/orders`,
        {
          headers: {
            "Authorization": `Bearer ${JSON.parse(localStorage.getItem("decor_current_user") || "{}")?.token}`
          }
        }
      );
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        const ordersList = data.orders || data || [];
        
        // Фильтр по дате
        const now = new Date();
        const daysToSubtract = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 365;
        const cutoffDate = new Date(now.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
        
        const filtered = ordersList.filter((o: Order) => new Date(o.createdAt) >= cutoffDate);
        setOrders(filtered);
        
        // Группировка по дням
        const statsByDate: Record<string, DailyStats> = {};
        filtered.forEach((order: Order) => {
          const date = order.createdAt.split("T")[0];
          if (!statsByDate[date]) {
            statsByDate[date] = { date, revenue: 0, orders: 0 };
          }
          statsByDate[date].revenue += order.totalAmount || 0;
          statsByDate[date].orders += 1;
        });
        setDailyStats(Object.values(statsByDate).sort((a, b) => a.date.localeCompare(b.date)));
      }

      // Загрузка пользователей
      const usersRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://premium-reklam-backend.onrender.com"}/api/users`,
        {
          headers: {
            "Authorization": `Bearer ${JSON.parse(localStorage.getItem("decor_current_user") || "{}")?.token}`
          }
        }
      );
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error("[Analytics] Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Ключевые метрики
  const metrics = {
    totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    totalOrders: orders.length,
    avgOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / orders.length : 0,
    totalPaid: orders.reduce((sum, o) => sum + (o.paidAmount || 0), 0),
    totalDebt: orders.reduce((sum, o) => sum + ((o.totalAmount || 0) - (o.paidAmount || 0)), 0),
    completedOrders: orders.filter(o => o.status === "completed").length,
    pendingOrders: orders.filter(o => o.status === "pending").length,
    activeCustomers: new Set(orders.map(o => o.userId)).size,
  };

  // 🔥 Статусы заказов (для круговой диаграммы)
  const statusDistribution = {
    pending: orders.filter(o => o.status === "pending").length,
    approved: orders.filter(o => o.status === "approved").length,
    production: orders.filter(o => o.status === "production").length,
    ready: orders.filter(o => o.status === "ready").length,
    completed: orders.filter(o => o.status === "completed").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  };

  // 🔥 Топ продуктов
  const productStats: Record<string, { quantity: number; revenue: number }> = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!productStats[item.productName]) {
        productStats[item.productName] = { quantity: 0, revenue: 0 };
      }
      productStats[item.productName].quantity += item.quantity;
      productStats[item.productName].revenue += item.lineTotal || 0;
    });
  });
  const topProducts = Object.entries(productStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // 🔥 Топ клиентов
  const customerStats: Record<string, { name: string; orders: number; revenue: number }> = {};
  orders.forEach(order => {
    const customerId = String(order.userId);
    if (!customerStats[customerId]) {
      customerStats[customerId] = { 
        name: order.userFullName || "Naməlum", 
        orders: 0, 
        revenue: 0 
      };
    }
    customerStats[customerId].orders += 1;
    customerStats[customerId].revenue += order.totalAmount || 0;
  });
  const topCustomers = Object.entries(customerStats)
    .map(([id, stats]) => ({ id, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // 🔥 Динамика выручки (для линейного графика)
  const maxDailyRevenue = Math.max(...dailyStats.map(s => s.revenue), 1);

  const handleExport = () => {
    const headers = ["Tarix", "Gəlir (AZN)", "Sifariş sayı"];
    const rows = dailyStats.map(s => [s.date, s.revenue.toFixed(2), s.orders]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics_export_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D90429] mx-auto" />
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-[#D90429]" />
          <h1 className="text-2xl font-bold text-[#1F2937]">Analytics Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          >
            <option value="7d">Son 7 gün</option>
            <option value="30d">Son 30 gün</option>
            <option value="90d">Son 90 gün</option>
            <option value="all">Hamısı</option>
          </select>
          <Button onClick={handleExport} variant="ghost" size="sm" icon={<Download className="w-4 h-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* 🔥 Ключевые метрики */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <span className="text-xs text-green-600 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +12%
            </span>
          </div>
          <p className="text-[#6B7280] text-sm">Ümumi gəlir</p>
          <p className="text-2xl font-bold text-[#1F2937]">{metrics.totalRevenue.toFixed(2)} AZN</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <ShoppingBag className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-blue-600 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +8%
            </span>
          </div>
          <p className="text-[#6B7280] text-sm">Sifariş sayı</p>
          <p className="text-2xl font-bold text-[#1F2937]">{metrics.totalOrders}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-purple-500" />
            <span className="text-xs text-purple-600 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +5%
            </span>
          </div>
          <p className="text-[#6B7280] text-sm">Aktiv müştərilər</p>
          <p className="text-2xl font-bold text-[#1F2937]">{metrics.activeCustomers}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-amber-500" />
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" /> -3%
            </span>
          </div>
          <p className="text-[#6B7280] text-sm">Orta çək</p>
          <p className="text-2xl font-bold text-[#1F2937]">{metrics.avgOrderValue.toFixed(2)} AZN</p>
        </Card>
      </div>

      {/* 🔥 Дополнительные метрики */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-green-50">
          <p className="text-green-600 text-sm">Ödənilib</p>
          <p className="text-xl font-bold text-green-700">{metrics.totalPaid.toFixed(2)} AZN</p>
        </Card>
        <Card className="p-4 bg-red-50">
          <p className="text-red-600 text-sm">Borc</p>
          <p className="text-xl font-bold text-red-700">{metrics.totalDebt.toFixed(2)} AZN</p>
        </Card>
        <Card className="p-4 bg-emerald-50">
          <p className="text-emerald-600 text-sm">Tamamlanıb</p>
          <p className="text-xl font-bold text-emerald-700">{metrics.completedOrders}</p>
        </Card>
        <Card className="p-4 bg-amber-50">
          <p className="text-amber-600 text-sm">Gözləyir</p>
          <p className="text-xl font-bold text-amber-700">{metrics.pendingOrders}</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* 🔥 График выручки по дням */}
        <Card className="p-6">
          <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Gəlir dinamikası
          </h3>
          {dailyStats.length === 0 ? (
            <p className="text-[#6B7280] text-center py-8">Məlumat yoxdur</p>
          ) : (
            <div className="space-y-2">
              {dailyStats.slice(-14).map((stat) => (
                <div key={stat.date} className="flex items-center gap-3">
                  <span className="text-xs text-[#6B7280] w-20">
                    {new Date(stat.date).toLocaleDateString("az-AZ", { day: "numeric", month: "short" })}
                  </span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#D90429] to-[#EF476F] rounded-full"
                      style={{ width: `${(stat.revenue / maxDailyRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-[#1F2937] w-20 text-right">
                    {stat.revenue.toFixed(0)} AZN
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 🔥 Распределение по статусам */}
        <Card className="p-6">
          <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Statuslar üzrə paylanma
          </h3>
          {orders.length === 0 ? (
            <p className="text-[#6B7280] text-center py-8">Məlumat yoxdur</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(statusDistribution).map(([status, count]) => {
                const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
                const colors: Record<string, string> = {
                  pending: "bg-amber-500",
                  approved: "bg-blue-500",
                  production: "bg-purple-500",
                  ready: "bg-indigo-500",
                  completed: "bg-green-500",
                  cancelled: "bg-red-500",
                };
                const labels: Record<string, string> = {
                  pending: "Gözləyir",
                  approved: "Təsdiqləndi",
                  production: "İstehsalat",
                  ready: "Hazır",
                  completed: "Tamamlandı",
                  cancelled: "Ləğv edildi",
                };
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${colors[status]}`} />
                    <span className="text-sm text-[#6B7280] flex-1">{labels[status]}</span>
                    <span className="text-sm font-medium text-[#1F2937]">{count}</span>
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colors[status]} rounded-full`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 🔥 Топ продуктов */}
        <Card className="p-6">
          <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Top məhsullar
          </h3>
          {topProducts.length === 0 ? (
            <p className="text-[#6B7280] text-center py-8">Məlumat yoxdur</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, idx) => (
                <div key={product.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-[#D90429]/10 rounded-full flex items-center justify-center text-xs font-bold text-[#D90429]">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1F2937]">{product.name}</p>
                    <p className="text-xs text-[#6B7280]">{product.quantity} ədəd</p>
                  </div>
                  <span className="text-sm font-bold text-[#1F2937]">{product.revenue.toFixed(2)} AZN</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 🔥 Топ клиентов */}
        <Card className="p-6">
          <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Top müştərilər
          </h3>
          {topCustomers.length === 0 ? (
            <p className="text-[#6B7280] text-center py-8">Məlumat yoxdur</p>
          ) : (
            <div className="space-y-3">
              {topCustomers.map((customer, idx) => (
                <div key={customer.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1F2937]">{customer.name}</p>
                    <p className="text-xs text-[#6B7280]">{customer.orders} sifariş</p>
                  </div>
                  <span className="text-sm font-bold text-[#1F2937]">{customer.revenue.toFixed(2)} AZN</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}