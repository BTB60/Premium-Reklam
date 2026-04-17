// src/app/admin/dashboard/components/AnalyticsDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  TrendingUp, DollarSign, ShoppingBag, Users, 
  Package, Download, AlertCircle
} from "lucide-react";

// ✅ Универсальный интерфейс: поддерживает поля бэкенда и Mock DB
interface Order {
  id: string | number;
  orderNumber?: string;
  userId?: string | number;
  userFullName?: string;
  customerName?: string;
  // Статусы: поддерживаем оба формата
  status?: string;           // legacy: pending, completed
  workflowStatus?: string;   // new: təsdiq, bitdi
  // Суммы: поддерживаем оба поля
  totalAmount?: number;      // бэкенд
  finalTotal?: number;       // Mock DB
  paidAmount?: number;
  paymentStatus?: string;    // pending, partial, paid
  createdAt: string;
  items?: OrderItem[];
}

interface OrderItem {
  id?: number;
  productName?: string;
  name?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
  totalPrice?: number;
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "https://premium-reklam-backend.onrender.com/api";

// ✅ Хелпер: получение суммы заказа (универсальный)
const getOrderTotal = (o: Order): number => {
  return Number(o.finalTotal || o.totalAmount || 0);
};

// ✅ Хелпер: проверка статуса "оплачен"
const isOrderPaid = (o: Order): boolean => {
  return o.paymentStatus === "paid" || o.workflowStatus === "bitdi" || o.status === "completed";
};

// ✅ Хелпер: проверка статуса "в работе"
const isOrderPending = (o: Order): boolean => {
  return o.workflowStatus === "təsdiq" || o.status === "pending";
};

export default function AnalyticsDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [source, setSource] = useState<"api" | "local">("api");

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const getToken = () => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("decor_current_user");
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed?.token || null;
    } catch {
      return null;
    }
  };

  // ✅ Загрузка из localStorage (гарантированный фоллбэк)
  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem("decor_orders");
      if (stored) {
        const localOrders = JSON.parse(stored);
        console.log("[Analytics] Loaded from localStorage:", localOrders.length);
        setOrders(localOrders);
        setSource("local");
        processOrders(localOrders);
        setError("");
        return true;
      }
    } catch (e) {
      console.warn("[Analytics] LocalStorage parse error:", e);
    }
    return false;
  };

  // ✅ Обработка заказов: группировка по датам
  const processOrders = (ordersList: Order[]) => {
    const now = new Date();
    const daysToSubtract = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 365;
    const cutoffDate = new Date(now.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
    
    const filtered = ordersList.filter((o) => {
      const dateStr = o.createdAt || (o as any).createdDate || "";
      const orderDate = new Date(dateStr);
      return !isNaN(orderDate.getTime()) && orderDate >= cutoffDate;
    });
    
    // Группировка по дням
    const statsByDate: Record<string, DailyStats> = {};
    filtered.forEach((order) => {
      const date = (order.createdAt || (order as any).createdDate || "").split("T")[0];
      if (date) {
        if (!statsByDate[date]) {
          statsByDate[date] = { date, revenue: 0, orders: 0 };
        }
        statsByDate[date].revenue += getOrderTotal(order);
        statsByDate[date].orders += 1;
      }
    });
    setDailyStats(Object.values(statsByDate).sort((a, b) => a.date.localeCompare(b.date)));
  };

  const loadAnalytics = async () => {
    setError("");
    setLoading(true);
    
    try {
      const token = getToken();
      const headers: HeadersInit = token ? { "Authorization": `Bearer ${token}` } : {};

      // 🔥 Загрузка заказов с бэкенда
      const ordersRes = await fetch(`${API_BASE}/orders`, { headers });
      
      // ✅ КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: 403/404/500 → фоллбэк на localStorage
      if (!ordersRes.ok) {
        console.log(`[Analytics] Backend returned ${ordersRes.status}, switching to localStorage`);
        if (!loadFromLocalStorage()) {
          setError(`Server: ${ordersRes.status}. Данные загружены локально.`);
          setOrders([]);
        }
        setLoading(false);
        return;
      }
      
      const data = await ordersRes.json();
      const ordersList: Order[] = Array.isArray(data) 
        ? data 
        : data?.orders ? data.orders 
        : data?.content ? data.content 
        : [];
      
      console.log("[Analytics] Orders from API:", ordersList.length);
      setOrders(ordersList);
      setSource("api");
      processOrders(ordersList);
      
    } catch (err: any) {
      console.warn("[Analytics] Network error, using localStorage:", err.message);
      if (!loadFromLocalStorage()) {
        setError("Не удалось загрузить данные");
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Ключевые метрики (универсальные)
  const metrics = {
    totalRevenue: orders.reduce((sum, o) => sum + getOrderTotal(o), 0),
    totalOrders: orders.length,
    avgOrderValue: orders.length > 0 
      ? orders.reduce((sum, o) => sum + getOrderTotal(o), 0) / orders.length 
      : 0,
    totalPaid: orders.reduce((sum, o) => sum + (o.paidAmount || getOrderTotal(o)), 0),
    completedOrders: orders.filter(o => 
      o.workflowStatus === "bitdi" || o.status === "completed" || o.status === "COMPLETED"
    ).length,
    pendingOrders: orders.filter(o => 
      o.workflowStatus === "təsdiq" || o.status === "pending" || o.status === "PENDING"
    ).length,
    activeCustomers: new Set(orders.map(o => o.userId || (o as any).customerId)).size,
  };

  // 🔥 Статусы: маппинг обоих форматов
  const getStatusKey = (o: Order): string => {
    if (o.workflowStatus) return o.workflowStatus; // new: təsdiq, ödəniş, bitdi
    if (o.status) return o.status.toLowerCase();    // legacy: pending, completed
    return "unknown";
  };

  const statusDistribution: Record<string, number> = {};
  orders.forEach(o => {
    const key = getStatusKey(o);
    statusDistribution[key] = (statusDistribution[key] || 0) + 1;
  });

  // 🔥 Топ продуктов
  const productStats: Record<string, { quantity: number; revenue: number }> = {};
  orders.forEach(order => {
    if (Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        const name = item.productName || item.name || "Unknown";
        if (!productStats[name]) productStats[name] = { quantity: 0, revenue: 0 };
        productStats[name].quantity += item.quantity || 1;
        productStats[name].revenue += item.lineTotal || item.totalPrice || item.unitPrice || 0;
      });
    }
  });
  const topProducts = Object.entries(productStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // 🔥 Топ клиентов
  const customerStats: Record<string, { name: string; orders: number; revenue: number }> = {};
  orders.forEach(order => {
    const customerId = String(order.userId || (order as any).customerId || "unknown");
    if (!customerStats[customerId]) {
      customerStats[customerId] = { 
        name: order.userFullName || order.customerName || "Naməlum",
        orders: 0, revenue: 0 
      };
    }
    customerStats[customerId].orders += 1;
    customerStats[customerId].revenue += getOrderTotal(order);
  });
  const topCustomers = Object.entries(customerStats)
    .map(([id, stats]) => ({ id, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const maxDailyRevenue = dailyStats.length > 0 ? Math.max(...dailyStats.map(s => s.revenue), 1) : 1;

  const handleExport = () => {
    const headers = ["Tarix", "Gəlir (AZN)", "Sifariş sayı"];
    const rows = dailyStats.map(s => [s.date, s.revenue.toFixed(2), s.orders]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`;
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

      {error && source === "api" && (
        <Card className="p-4 mb-6 bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2 text-amber-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error} • Rejim: <b>Offline (localStorage)</b></span>
          </div>
        </Card>
      )}

      {source === "local" && (
        <div className="mb-4 text-xs text-gray-500">📊 Məlumat mənbəyi: Lokal yaddaş</div>
      )}

      {/* 🔥 Ключевые метрики */}
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

      {/* 🔥 Дополнительные метрики */}
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
          <p className="text-xl font-bold text-gray-700">{statusDistribution["cancelled"] || 0}</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* 🔥 График выручки */}
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

        {/* 🔥 Статусы */}
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
                .filter(([_, count]) => count > 0)
                .map(([status, count]) => {
                  const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
                  const colors: Record<string, string> = {
                    "təsdiq": "bg-amber-500", "pending": "bg-amber-500",
                    "ödəniş": "bg-blue-500", "approved": "bg-blue-500",
                    "dizayn": "bg-purple-500", "production": "bg-purple-500",
                    "istehsal": "bg-indigo-500", "ready": "bg-indigo-500",
                    "kuryer": "bg-cyan-500", "delivering": "bg-cyan-500",
                    "bitdi": "bg-green-500", "completed": "bg-green-500",
                    "cancelled": "bg-red-500",
                  };
                  const labels: Record<string, string> = {
                    "təsdiq": "Gözləyir", "pending": "Gözləyir",
                    "ödəniş": "Ödəniş", "approved": "Təsdiqləndi",
                    "dizayn": "Dizayn", "production": "İstehsalat",
                    "istehsal": "İstehsalat", "ready": "Hazır",
                    "kuryer": "Kuryerdə", "delivering": "Çatdırılma",
                    "bitdi": "Tamamlandı", "completed": "Tamamlandı",
                    "cancelled": "Ləğv edildi",
                  };
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${colors[status] || "bg-gray-400"}`} />
                      <span className="text-sm text-[#6B7280] flex-1">{labels[status] || status}</span>
                      <span className="text-sm font-medium text-[#1F2937]">{count}</span>
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colors[status] || "bg-gray-400"} rounded-full`}
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