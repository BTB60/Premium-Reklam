"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Download,
  AlertCircle,
} from "lucide-react";
import { getAdminBearerToken, getAdminDashboardApiBase } from "./admin-dashboard-api";
import {
  computeMetrics,
  computeStatusDistribution,
  computeTopCustomers,
  computeTopProducts,
  maxDailyRevenue,
} from "./analytics-dashboard/compute";
import type { AnalyticsOrder, DailyStats } from "./analytics-dashboard/types";

const API_BASE = getAdminDashboardApiBase();

export default function AnalyticsDashboard() {
  const [orders, setOrders] = useState<AnalyticsOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const getToken = () => getAdminBearerToken();

  const loadAnalytics = async () => {
    setError("");
    setLoading(true);

    try {
      const token = getToken();
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const ordersRes = await fetch(`${API_BASE}/orders`, { headers });

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        const ordersList = Array.isArray(data)
          ? data
          : data?.orders
            ? data.orders
            : data?.content
              ? data.content
              : [];

        const now = new Date();
        const daysToSubtract =
          dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 365;
        const cutoffDate = new Date(now.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);

        const filtered = ordersList.filter((o: AnalyticsOrder) => {
          const raw = o as unknown as { createdAt?: string; createdDate?: string; date?: string };
          const orderDate = new Date(raw.createdAt || raw.createdDate || raw.date || "");
          return !Number.isNaN(orderDate.getTime()) && orderDate >= cutoffDate;
        });

        setOrders(filtered);

        const statsByDate: Record<string, DailyStats> = {};
        filtered.forEach((order: AnalyticsOrder) => {
          const raw = order as unknown as { createdAt?: string; createdDate?: string };
          const date = (raw.createdAt || raw.createdDate || "").split("T")[0];
          if (date) {
            if (!statsByDate[date]) {
              statsByDate[date] = { date, revenue: 0, orders: 0 };
            }
            statsByDate[date].revenue += order.totalAmount || 0;
            statsByDate[date].orders += 1;
          }
        });
        setDailyStats(Object.values(statsByDate).sort((a, b) => a.date.localeCompare(b.date)));
      } else {
        const errText = await ordersRes.text().catch(() => "Unknown error");
        setError(`Orders: ${ordersRes.status} ${errText.slice(0, 100)}`);
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load analytics";
      setError(message);
      try {
        const stored = localStorage.getItem("decor_orders");
        if (stored) {
          setOrders(JSON.parse(stored));
          setError("");
        }
      } catch {
        /* ignore */
      }
    } finally {
      setLoading(false);
    }
  };

  const metrics = computeMetrics(orders);
  const statusDistribution = computeStatusDistribution(orders);
  const topProducts = computeTopProducts(orders);
  const topCustomers = computeTopCustomers(orders);
  const dailyMax = maxDailyRevenue(dailyStats);

  const handleExport = () => {
    const headers = ["Tarix", "Gəlir (AZN)", "Sifariş sayı"];
    const rows = dailyStats.map((s) => [s.date, s.revenue.toFixed(2), s.orders]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
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

      {error && (
        <Card className="p-4 mb-6 bg-red-50 border border-red-200">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-[#6B7280] text-sm">Ümumi gəlir</p>
          <p className="text-2xl font-bold text-[#1F2937]">{metrics.totalRevenue.toFixed(2)} AZN</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <ShoppingBag className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-[#6B7280] text-sm">Sifariş sayı</p>
          <p className="text-2xl font-bold text-[#1F2937]">{metrics.totalOrders}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-[#6B7280] text-sm">Aktiv müştərilər</p>
          <p className="text-2xl font-bold text-[#1F2937]">{metrics.activeCustomers}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-[#6B7280] text-sm">Orta çək</p>
          <p className="text-2xl font-bold text-[#1F2937]">{metrics.avgOrderValue.toFixed(2)} AZN</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-green-50">
          <p className="text-green-600 text-sm">Ödənilib</p>
          <p className="text-xl font-bold text-green-700">{metrics.totalPaid.toFixed(2)} AZN</p>
        </Card>
        <Card className="p-4 bg-emerald-50">
          <p className="text-emerald-600 text-sm">Tamamlanıb</p>
          <p className="text-xl font-bold text-emerald-700">{metrics.completedOrders}</p>
        </Card>
        <Card className="p-4 bg-amber-50">
          <p className="text-amber-600 text-sm">Gözləyir</p>
          <p className="text-xl font-bold text-amber-700">{metrics.pendingOrders}</p>
        </Card>
        <Card className="p-4 bg-gray-50">
          <p className="text-gray-600 text-sm">Ləğv edildi</p>
          <p className="text-xl font-bold text-gray-700">{statusDistribution.cancelled}</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
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
                      style={{ width: `${(stat.revenue / dailyMax) * 100}%` }}
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

        <Card className="p-6">
          <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Statuslar üzrə paylanma
          </h3>
          {orders.length === 0 ? (
            <p className="text-[#6B7280] text-center py-8">Məlumat yoxdur</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(statusDistribution)
                .filter(([, count]) => count > 0)
                .map(([status, count]) => {
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
