// src/app/admin/dashboard/components/OrdersTable.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, Trash2, DollarSign, Wallet, RefreshCw } from "lucide-react";
import { orders as ordersDb, notifications } from "@/lib/db/orders";
import { auth } from "@/lib/db/auth";
import { StatusBadge } from "@/components/ui/StatusBadge";

// Типы данных
interface OrderItem {
  id: number | string;
  productName: string;
  product_name?: string;
  width?: number;
  height?: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  line_total?: number;
  totalPrice?: number;
}

interface Order {
  id: string | number;
  orderNumber?: string;
  order_number?: string;
  customerName?: string;
  customer_name?: string;
  customerPhone?: string;
  customer_phone?: string;
  userId?: string | number;
  status?: string;
  workflowStatus?: string;
  paymentStatus?: string;
  payment_status?: string;
  finalTotal?: number;
  totalAmount?: number;
  bonusUsed?: number;
  bonus_used?: number;
  paidAmount?: number;
  paid_amount?: number;
  createdAt: string;
  items: OrderItem[];
}

interface User {
  id: string | number;
  fullName: string;
  username: string;
}

// Безопасный доступ к полям
const get = (obj: any, keys: (keyof any)[], fallback: any = undefined) => {
  for (const k of keys) if (obj[k] !== undefined) return obj[k];
  return fallback;
};

// Конфигурация статусов
const WORKFLOW_STATUS_CONFIG = [
  { value: "təsdiq", label: "Təsdiq" },
  { value: "ödəniş", label: "Ödəniş" },
  { value: "dizayn", label: "Dizayn" },
  { value: "istehsal", label: "İstehsal" },
  { value: "kuryer", label: "Kuryer" },
  { value: "bitdi", label: "Bitdi" },
  { value: "cancelled", label: "Ləğv edildi" },
];

export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);

  // ✅ Загрузка заказов из локальной БД (не через API)
  const loadOrders = useCallback(() => {
    try {
      const all = ordersDb.getAll();
      setOrders(all);
    } catch (e) {
      console.error("[OrdersTable] Load error:", e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Загрузка пользователей (для отображения имён)
  const loadUsers = useCallback(() => {
    try {
      const allUsers = auth.getAllUsers();
      setUsers(allUsers.filter(u => u.role !== "ADMIN"));
    } catch (e) {
      console.error("[OrdersTable] Load users error:", e);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    loadUsers();
  }, [loadOrders, loadUsers]);

  // Кросс-таб синхронизация: если в другой вкладке изменили заказ — обновляем таблицу
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "decor_orders") {
        loadOrders();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [loadOrders]);

  // ✅ Исправленная смена статуса: через локальную БД + уведомление пользователя
  const updateOrderStatus = async (orderId: string | number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const order = ordersDb.getById(String(orderId));
      if (!order) throw new Error("Sifariş tapılmadı");

      const oldStatus = order.workflowStatus || order.status;
      
      // Обновляем статус через Mock DB (это автоматически синхронизирует с ЛК пользователя)
      const updated = ordersDb.updateWorkflowStatus(String(orderId), newStatus as any);
      if (!updated) throw new Error("Status yenilənmədi");

      // 🔔 Если статус сменился на "ödəniş" — уведомляем пользователя
      if (newStatus === "ödəniş" && oldStatus !== "ödəniş") {
        notifications.create({
          userId: String(order.userId),
          title: "Ödəniş təsdiqləndi",
          message: `Sifariş #${order.orderNumber || order.id.slice(-4)} istehsalata qəbul edildi.`,
          type: "order_status",
        });
      }

      // Обновляем таблицу и сбрасываем индикатор админа
      loadOrders();
      if ((window as any).__adminBellRefresh) {
        (window as any).__adminBellRefresh();
      }
    } catch (e: any) {
      console.error("[OrdersTable] Update error:", e);
      alert(e.message || "Xəta baş verdi");
    } finally {
      setUpdatingId(null);
    }
  };

  // Удаление заказа
  const deleteOrder = async (orderId: string | number) => {
    if (!confirm("Sifarişi silmək istədiyinizə əminsiniz?")) return;
    try {
      const result = ordersDb.delete(String(orderId));
      if (result) {
        loadOrders();
        if ((window as any).__adminBellRefresh) {
          (window as any).__adminBellRefresh();
        }
      } else {
        alert("Sifariş silinmədi");
      }
    } catch (e: any) {
      console.error("[OrdersTable] Delete error:", e);
      alert("Xəta baş verdi");
    }
  };

  // Фильтрация
  const getStatus = (order: Order) => order.workflowStatus || order.status || "pending";
  
  const filteredOrders = orders.filter(order => {
    const status = getStatus(order);
    const user = users.find(u => String(u.id) === String(order.userId));
    const orderNum = get(order, ["orderNumber", "order_number"], "");
    const custName = get(order, ["customerName", "customer_name"], "");

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        String(order.id).includes(q) ||
        String(orderNum).toLowerCase().includes(q) ||
        (user?.fullName || "").toLowerCase().includes(q) ||
        (user?.username || "").toLowerCase().includes(q) ||
        custName.toLowerCase().includes(q) ||
        order.items?.some(i => (i.productName || i.product_name || "").toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }
    if (statusFilter !== "all" && status !== statusFilter) return false;
    if (userFilter !== "all" && String(order.userId) !== userFilter) return false;
    if (dateFilter !== "all") {
      const orderDate = new Date(order.createdAt).getTime();
      const now = new Date().getTime();
      const daysDiff = (now - orderDate) / (1000 * 60 * 60 * 24);
      if (dateFilter === "today" && daysDiff > 1) return false;
      if (dateFilter === "week" && daysDiff > 7) return false;
      if (dateFilter === "month" && daysDiff > 30) return false;
    }
    return true;
  });

  const getStatusCount = (status: string) => orders.filter(o => getStatus(o) === status).length;
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (get(o, ["finalTotal", "totalAmount"], 0) || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1F2937]">Sifarişlər</h1>
        <Button variant="ghost" size="sm" onClick={() => { loadOrders(); loadUsers(); }} icon={<RefreshCw className="w-4 h-4" />}>
          Yenilə
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Hamısı", value: orders.length, color: "bg-gray-100" },
          ...WORKFLOW_STATUS_CONFIG.map(cfg => ({ label: cfg.label, value: getStatusCount(cfg.value), color: "bg-gray-50" }))
        ].map((stat) => (
          <Card
            key={stat.label}
            className={`p-4 cursor-pointer transition-all ${
              statusFilter === (stat.label === "Hamısı" ? "all" : WORKFLOW_STATUS_CONFIG.find(c => c.label === stat.label)?.value || "all")
                ? "ring-2 ring-[#D90429]"
                : ""
            }`}
            onClick={() => setStatusFilter(stat.label === "Hamısı" ? "all" : (WORKFLOW_STATUS_CONFIG.find(c => c.label === stat.label)?.value || "all"))}
          >
            <p className="text-2xl font-bold text-[#1F2937]">{stat.value}</p>
            <p className="text-xs text-[#6B7280]">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Выручка */}
      <Card className="p-4 mb-6 bg-gradient-to-r from-[#D90429] to-[#EF476F] text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">Filtr üzrə ümumi gəlir</p>
            <p className="text-3xl font-bold">{totalRevenue.toFixed(2)} AZN</p>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm">Filtr üzrə sifariş</p>
            <p className="text-xl font-bold">{filteredOrders.length} ədəd</p>
          </div>
        </div>
      </Card>

      {/* Фильтры */}
      <Card className="p-4 mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Axtar (ID, Ad, Məhsul)..."
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
            {WORKFLOW_STATUS_CONFIG.map(cfg => (
              <option key={cfg.value} value={cfg.value}>{cfg.label}</option>
            ))}
          </select>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          >
            <option value="all">Bütün istifadəçilər</option>
            {users.filter(u => u.username !== "admin").map(u => (
              <option key={u.id} value={u.id}>{u.fullName} (@{u.username})</option>
            ))}
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

      {/* Таблица */}
      {loading ? (
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D90429] mx-auto" />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Müştəri</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Məhsullar</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Məbləğ</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Bonus</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">İdarəetmə</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#6B7280]">Sifariş tapılmadı</td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const orderUser = users.find(u => String(u.id) === String(order.userId));
                    const status = getStatus(order);
                    const total = get(order, ["finalTotal", "totalAmount"], 0);
                    const bonus = get(order, ["bonusUsed", "bonus_used"], 0);
                    const orderNum = get(order, ["orderNumber", "order_number"], String(order.id).slice(-6));
                    const custName = get(order, ["customerName", "customer_name"], "Naməlum");

                    return (
                      <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium">#{orderNum}</td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-[#1F2937]">{orderUser?.fullName || custName}</p>
                          <p className="text-xs text-[#6B7280]">@{orderUser?.username || "-"}</p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {order.items?.slice(0, 2).map((item, idx) => (
                              <span key={idx} className="text-xs px-2 py-1 bg-gray-100 rounded truncate">
                                {item.productName || item.product_name}
                              </span>
                            ))}
                            {(order.items?.length || 0) > 2 && (
                              <span className="text-xs px-2 py-1 bg-gray-100 rounded">+{order.items.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-[#1F2937]">
                          {Number(total).toFixed(2)} AZN
                        </td>
                        <td className="py-3 px-4">
                          {bonus > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                              <Wallet className="w-3 h-3" />
                              -{Number(bonus).toFixed(2)} AZN
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={status} size="sm" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              disabled={updatingId === order.id}
                              className={`text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#D90429] ${updatingId === order.id ? "opacity-50 cursor-wait" : ""}`}
                            >
                              {WORKFLOW_STATUS_CONFIG.map(cfg => (
                                <option key={cfg.value} value={cfg.value}>{cfg.label}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => deleteOrder(order.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}