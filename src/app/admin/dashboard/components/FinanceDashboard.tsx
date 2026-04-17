// src/app/admin/dashboard/components/FinanceDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { 
  Search, Download, DollarSign, TrendingUp, TrendingDown, 
  Wallet, CreditCard, AlertCircle, CheckCircle, Clock, Filter, Package
} from "lucide-react";

// ✅ Универсальные интерфейсы: поддерживают поля бэкенда и Mock DB
interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  width: number;
  height: number;
  quantity: number;
  unitPrice: number;     // Цена продажи
  totalPrice: number;
}

interface Product {
  id: string;
  name: string;
  basePrice: number;     // Цена продажи
  costPrice?: number;    // ✅ Закупочная цена (ключевое поле)
  unit: "m²" | "ədəd" | "metr";
  isActive: boolean;
  category: string;
  description: string;
  minOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: string;
  orderNumber?: string;
  userId: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  workflowStatus: string;
  paymentStatus: "pending" | "partial" | "paid";
  finalTotal: number;
  paidAmount?: number;
  createdAt: string;
}

interface User {
  id: string;
  fullName: string;
  username: string;
}

// ✅ Агрегированная строка для таблицы (рассчитывается на лету)
interface FinanceRow {
  id: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  userFullName: string;
  revenue: number;      // Выручка (продажа)
  cost: number;         // Себестоимость (закупка)
  profit: number;       // Прибыль (revenue - cost)
  margin: number;       // Маржа в %
  paymentStatus: string;
  paymentMethod?: string;
  createdAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "https://premium-reklam-backend.onrender.com/api";

export default function FinanceDashboard() {
  const [rows, setRows] = useState<FinanceRow[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [source, setSource] = useState<"api" | "local">("local");

  useEffect(() => {
    loadData();
  }, []);

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

  // ✅ Загрузка данных: гибридный режим (API → localStorage)
  const loadData = async () => {
    setLoading(true);
    setSource("local"); // По умолчанию локальный режим
    
    try {
      // 1. Загружаем товары (нужны для costPrice)
      const productsRaw = localStorage.getItem("decor_products");
      const productsList: Product[] = productsRaw ? JSON.parse(productsRaw) : [];
      const productsMap: Record<string, Product> = {};
      productsList.forEach(p => { if (p.isActive) productsMap[p.id] = p; });
      setProducts(productsMap);

      // 2. Загружаем пользователей
      const usersRaw = localStorage.getItem("decor_users");
      const usersList: User[] = usersRaw ? JSON.parse(usersRaw) : [];
      setUsers(usersList);

      // 3. Пробуем загрузить заказы с бэкенда
      const token = getToken();
      const ordersRes = await fetch(`${API_BASE}/orders`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });

      let ordersList: Order[] = [];
      
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        ordersList = Array.isArray(data) ? data : data?.orders || data?.content || [];
        setSource("api");
      } else {
        console.log(`[Finance] Backend ${ordersRes.status}, using localStorage`);
        const ordersRaw = localStorage.getItem("decor_orders");
        ordersList = ordersRaw ? JSON.parse(ordersRaw) : [];
      }

      // 4. Рассчитываем финансовые строки
      const calculated = calculateFinanceRows(ordersList, productsMap, usersList);
      setRows(calculated);
      setError("");
      
    } catch (err: any) {
      console.warn("[Finance] Load error, using localStorage:", err.message);
      // Фоллбэк: читаем всё из localStorage
      try {
        const productsRaw = localStorage.getItem("decor_products");
        const productsList: Product[] = productsRaw ? JSON.parse(productsRaw) : [];
        const productsMap: Record<string, Product> = {};
        productsList.forEach(p => { if (p.isActive) productsMap[p.id] = p; });
        setProducts(productsMap);

        const usersRaw = localStorage.getItem("decor_users");
        const usersList: User[] = usersRaw ? JSON.parse(usersRaw) : [];
        setUsers(usersList);

        const ordersRaw = localStorage.getItem("decor_orders");
        const ordersList: Order[] = ordersRaw ? JSON.parse(ordersRaw) : [];
        
        const calculated = calculateFinanceRows(ordersList, productsMap, usersList);
        setRows(calculated);
        setError("");
      } catch (e) {
        setError("Не удалось загрузить данные");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Ключевая функция: расчёт прибыли по каждому заказу
  const calculateFinanceRows = (
    orders: Order[], 
    products: Record<string, Product>, 
    users: User[]
  ): FinanceRow[] => {
    return orders
      .filter(o => o.items && Array.isArray(o.items))
      .map(order => {
        let revenue = 0;
        let cost = 0;

        order.items.forEach((item: OrderItem) => {
          const product = products[item.productId];
          const salePrice = item.unitPrice || 0;
          const purchasePrice = product?.costPrice ?? 0;
          
          // Для товаров с площадью: учитываем ширину × высоту
          const isAreaBased = product?.unit === "m²";
          const quantity = isAreaBased 
            ? (item.width || 0) * (item.height || 0) 
            : (item.quantity || 1);

          revenue += salePrice * quantity;
          cost += purchasePrice * quantity;
        });

        const profit = revenue - cost;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
        
        const user = users.find(u => u.id === String(order.userId));

        return {
          id: order.id,
          orderId: order.id,
          orderNumber: order.orderNumber || `#${order.id.slice(-6)}`,
          userId: order.userId,
          userFullName: user?.fullName || "Naməlum",
          revenue: Math.round(revenue * 100) / 100,
          cost: Math.round(cost * 100) / 100,
          profit: Math.round(profit * 100) / 100,
          margin: Math.round(margin * 100) / 100,
          paymentStatus: order.paymentStatus,
          paymentMethod: (order as any).paymentMethod,
          createdAt: order.createdAt,
        };
      });
  };

  // ✅ Фильтрация
  const filteredRows = rows.filter(row => {
    if (searchQuery) {
      const matches = 
        row.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.userFullName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matches) return false;
    }
    if (statusFilter !== "all" && row.paymentStatus !== statusFilter) return false;
    if (dateFilter !== "all") {
      const rowDate = new Date(row.createdAt);
      const now = new Date();
      const daysDiff = (now.getTime() - rowDate.getTime()) / (1000 * 60 * 60 * 24);
      if (dateFilter === "today" && daysDiff > 1) return false;
      if (dateFilter === "week" && daysDiff > 7) return false;
      if (dateFilter === "month" && daysDiff > 30) return false;
    }
    return true;
  });

  // ✅ Статистика (ПРИБЫЛЬ, а не просто выручка)
  const stats = {
    totalRevenue: filteredRows.reduce((sum, r) => sum + r.revenue, 0),   // Оборот
    totalCost: filteredRows.reduce((sum, r) => sum + r.cost, 0),         // Затраты
    totalProfit: filteredRows.reduce((sum, r) => sum + r.profit, 0),     // ✅ Чистая прибыль (Ümumi gəlir)
    avgMargin: filteredRows.length > 0 
      ? filteredRows.reduce((sum, r) => sum + r.margin, 0) / filteredRows.length 
      : 0,
    paidCount: filteredRows.filter(r => r.paymentStatus === "paid").length,
    pendingCount: filteredRows.filter(r => r.paymentStatus !== "paid").length,
  };

  const [error, setError] = useState<string>("");

  const handleExport = () => {
    const headers = ["ID", "Sifariş", "İstifadəçi", "Gəlir", "Xərc", "Mənfəət", "Marja", "Status", "Tarix"];
    const rows = filteredRows.map(r => [
      r.id, r.orderNumber, r.userFullName,
      r.revenue.toFixed(2), r.cost.toFixed(2), r.profit.toFixed(2),
      `${r.margin.toFixed(1)}%`, r.paymentStatus,
      new Date(r.createdAt).toLocaleDateString("az-AZ")
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance_profit_${new Date().toISOString().slice(0, 10)}.csv`;
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
          <Wallet className="w-8 h-8 text-[#D90429]" />
          <h1 className="text-2xl font-bold text-[#1F2937]">Maliyyə</h1>
        </div>
        <div className="flex gap-2">
          {source === "local" && (
            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">
              Lokal mənbə
            </span>
          )}
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

      {/* ✅ Статистика: ПРИБЫЛЬ вместо просто выручки */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded">
              {stats.avgMargin.toFixed(1)}%
            </span>
          </div>
          <p className="text-white/80 text-sm mt-2">Ümumi gəlir (Mənfəət)</p>
          <p className="text-2xl font-bold">
            {stats.totalProfit.toFixed(2)} AZN
          </p>
          <p className="text-xs text-white/60 mt-1">
            Gəlir: {stats.totalRevenue.toFixed(0)} − Xərc: {stats.totalCost.toFixed(0)}
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <DollarSign className="w-6 h-6" />
          </div>
          <p className="text-white/80 text-sm mt-2">Ümumi dövriyyə</p>
          <p className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} AZN</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-amber-500" />
            <span className="text-xs text-amber-600">Xərc</span>
          </div>
          <p className="text-[#6B7280] text-sm">Məhsul maya dəyəri</p>
          <p className="text-2xl font-bold text-[#1F2937]">{stats.totalCost.toFixed(2)} AZN</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-xs text-green-600">Marja</span>
          </div>
          <p className="text-[#6B7280] text-sm">Orta mənfəətlik</p>
          <p className="text-2xl font-bold text-[#1F2937]">{stats.avgMargin.toFixed(1)}%</p>
        </Card>
      </div>

      {/* Фильтры */}
      <Card className="p-4 mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Axtar: ID, sifariş, istifadəçi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          >
            <option value="all">Bütün statuslar</option>
            <option value="paid">Ödənilib</option>
            <option value="pending">Gözləyir</option>
            <option value="partial">Qismən</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          >
            <option value="all">Bütün tarixlər</option>
            <option value="today">Bu gün</option>
            <option value="week">Son 7 gün</option>
            <option value="month">Son 30 gün</option>
          </select>
        </div>
      </Card>

      {/* ✅ Таблица: Выручка / Затраты / Прибыль */}
      <Card className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Sifariş</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">İstifadəçi</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B7280]">Gəlir</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B7280]">Xərc</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B7280]">Mənfəət</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B7280]">Marja</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#6B7280]">
                  Məlumat tapılmadı
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">
                    <span className="text-sm text-[#6B7280]">{row.orderNumber}</span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-sm">{row.userFullName}</p>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-[#1F2937]">
                    {row.revenue.toFixed(2)} AZN
                  </td>
                  <td className="py-3 px-4 text-right text-gray-500">
                    {row.cost.toFixed(2)} AZN
                  </td>
                  <td className="py-3 px-4 text-right font-bold">
                    <span className={row.profit >= 0 ? "text-green-600" : "text-red-600"}>
                      {row.profit.toFixed(2)} AZN
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      row.margin >= 30 ? "bg-green-100 text-green-700" :
                      row.margin >= 15 ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {row.margin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={row.paymentStatus} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Итоговая строка */}
      {filteredRows.length > 0 && (
        <Card className="mt-4 p-4 bg-[#1F2937] text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-white/60 text-xs">Göstərilən</p>
                <p className="font-bold">{filteredRows.length} ədəd</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Ümumi gəlir</p>
                <p className="font-bold text-green-400">{stats.totalRevenue.toFixed(2)} AZN</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Ümumi xərc</p>
                <p className="font-bold text-red-400">{stats.totalCost.toFixed(2)} AZN</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Xalis mənfəət</p>
                <p className="font-bold text-emerald-400">{stats.totalProfit.toFixed(2)} AZN</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs">Orta marja</p>
              <p className="font-bold">{stats.avgMargin.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}