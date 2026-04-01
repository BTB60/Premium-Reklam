"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, Trash2, Eye } from "lucide-react";
import { orderApi } from "@/lib/authApi";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Order {
  id: string | number;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  userId?: string | number;
  userFullName?: string;
  userUsername?: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  productName: string;
  width?: number;
  height?: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface User {
  id: string;
  fullName: string;
  username: string;
}

export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  useEffect(() => {
    loadOrders();
    loadUsers();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await orderApi.getOrdersFromBackend();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("[OrdersTable] Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://premium-reklam-backend.onrender.com"}/api/users`, {
        headers: {
          "Authorization": `Bearer ${JSON.parse(localStorage.getItem("decor_current_user") || "{}")?.token}`
        }
      });
      if (data.ok) {
        const usersData = await data.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error("[OrdersTable] Load users error:", error);
    }
  };

  const updateOrderStatus = async (orderId: string | number, status: string) => {
    try {
      const token = JSON.parse(localStorage.getItem("decor_current_user") || "{}")?.token;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://premium-reklam-backend.onrender.com"}/api/orders/${orderId}/status?status=${encodeURIComponent(status.toLowerCase())}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        loadOrders();
      } else {
        alert("Status yenilənmədi");
      }
    } catch (error) {
      console.error("[OrdersTable] Update status error:", error);
      alert("Xəta baş verdi");
    }
  };

  const deleteOrder = async (orderId: string | number) => {
    if (!confirm("Sifarişi silmək istədiyinizə əminsiniz?")) return;
    try {
      const token = JSON.parse(localStorage.getItem("decor_current_user") || "{}")?.token;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://premium-reklam-backend.onrender.com"}/api/orders/${orderId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        loadOrders();
      } else {
        alert("Sifariş silinmədi");
      }
    } catch (error) {
      console.error("[OrdersTable] Delete error:", error);
      alert("Xəta baş verdi");
    }
  };

  const filteredOrders = orders.filter(order => {
    if (searchQuery) {
      const user = users.find(u => u.id === String(order.userId));
      const matchesSearch = 
        order.id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.orderNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user?.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user?.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.items || []).some(i => (i.productName || "").toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;
    }
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (userFilter !== "all" && String(order.userId) !== userFilter) return false;
    if (dateFilter !== "all") {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      const daysDiff = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
      if (dateFilter === "today" && daysDiff > 1) return false;
      if (dateFilter === "week" && daysDiff > 7) return false;
      if (dateFilter === "month" && daysDiff > 30) return false;
    }
    return true;
  });

  const getStatusCount = (status: string) => orders.filter(o => o.status === status).length;
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1F2937] mb-6">Sifarişlər</h1>

      {/* Статистика по статусам */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Hamısı", value: orders.length, color: "bg-gray-100" },
          { label: "Gözləyir", value: getStatusCount("pending"), color: "bg-amber-100" },
          { label: "Hazırlanır", value: getStatusCount("production"), color: "bg-blue-100" },
          { label: "Hazır", value: getStatusCount("ready"), color: "bg-purple-100" },
          { label: "Tamamlandı", value: getStatusCount("completed"), color: "bg-green-100" },
        ].map((stat) => (
          <Card
            key={stat.label}
            className={`p-4 cursor-pointer transition-all ${
              statusFilter === (stat.label === "Hamısı" ? "all" : stat.label === "Gözləyir" ? "pending" : stat.label === "Hazırlanır" ? "production" : stat.label === "Hazır" ? "ready" : stat.label === "Tamamlandı" ? "completed" : "all")
                ? "ring-2 ring-[#D90429]"
                : ""
            }`}
            onClick={() => setStatusFilter(stat.label === "Hamısı" ? "all" : stat.label === "Gözləyir" ? "pending" : stat.label === "Hazırlanır" ? "production" : stat.label === "Hazır" ? "ready" : stat.label === "Tamamlandı" ? "completed" : "all")}
          >
            <p className="text-2xl font-bold text-[#1F2937]">{stat.value}</p>
            <p className="text-xs text-[#6B7280]">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Общая выручка */}
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
              placeholder="Axtar..."
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
            <option value="pending">Gözləyir</option>
            <option value="approved">Təsdiqləndi</option>
            <option value="design">Dizayn</option>
            <option value="printing">Çap</option>
            <option value="production">İstehsalat</option>
            <option value="ready">Hazır</option>
            <option value="delivering">Çatdırılma</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">Ləğv edildi</option>
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

      {/* Таблица заказов */}
      {loading ? (
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D90429] mx-auto" />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Sifariş ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">İstifadəçi</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Məhsullar</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Tarix</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Məbləğ</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#6B7280]">Sifariş tapılmadı</td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const orderUser = users.find(u => u.id === String(order.userId));
                  return (
                    <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-medium">#{order.orderNumber || order.id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-left">
                          <p className="font-medium">{orderUser?.fullName || order.customerName || "Naməlum"}</p>
                          <p className="text-xs text-[#6B7280]">@{orderUser?.username || "-"}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-gray-100 rounded">
                              {item.productName} ({item.width}×{item.height}m)
                            </span>
                          ))}
                          {order.items.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded">+{order.items.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-[#6B7280]">
                        {new Date(order.createdAt).toLocaleDateString("az-AZ")}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#1F2937]">
                        {order.totalAmount?.toFixed(2)} AZN
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="text-sm border border-gray-200 rounded px-2 py-1"
                          >
                            <option value="pending">Gözləyir</option>
                            <option value="approved">Təsdiqləndi</option>
                            <option value="design">Dizayn</option>
                            <option value="printing">Çap</option>
                            <option value="production">İstehsalat</option>
                            <option value="ready">Hazır</option>
                            <option value="delivering">Çatdırılma</option>
                            <option value="completed">Tamamlandı</option>
                            <option value="cancelled">Ləğv edildi</option>
                          </select>
                          <button
                            onClick={() => deleteOrder(order.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
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
        </Card>
      )}
    </div>
  );
}