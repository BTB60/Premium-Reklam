"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, Trash2, Download, RefreshCw } from "lucide-react";
import { authApi, orderApi, type Order as BackendOrder } from "@/lib/authApi";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { logAdminAction } from "@/lib/auditLog";
import { playPremiumNotificationIfOrderWaitToApproved } from "@/lib/notificationSound";

type Order = BackendOrder;

interface UserSummary {
  id: string | number;
  fullName: string;
  username: string;
}

export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [pollingEnabled, setPollingEnabled] = useState(true);

  useEffect(() => {
    void loadOrders();
    void loadUsers();
  }, []);

  useEffect(() => {
    if (!pollingEnabled) return;
    const intervalId = setInterval(() => {
      void loadOrders(false);
    }, 30000);
    return () => clearInterval(intervalId);
  }, [pollingEnabled]);

  useEffect(() => {
    const onRealtime = () => void loadOrders(false);
    window.addEventListener("premium:refresh-admin-orders", onRealtime);
    return () => window.removeEventListener("premium:refresh-admin-orders", onRealtime);
  }, []);

  const loadOrders = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const data = await orderApi.getOrdersFromBackend();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("[OrdersTable] Load orders error:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const allUsers = await authApi.getAllUsers();
      const normalized: UserSummary[] = (allUsers || []).map((u: any) => ({
        id: u.id ?? u.userId,
        fullName: u.fullName || u.full_name || u.username,
        username: u.username,
      }));
      setUsers(normalized);
    } catch (error) {
      console.error("[OrdersTable] Load users error:", error);
    }
  };

  const updateOrderStatus = async (orderId: string | number, status: string) => {
    const before = orders.find((o) => String(o.id) === String(orderId));
    try {
      await orderApi.updateStatus(orderId, status);
      playPremiumNotificationIfOrderWaitToApproved(before, status);
      await logAdminAction("ORDER_STATUS_UPDATED", { orderId, newStatus: status });
      await loadOrders(false);
    } catch (error) {
      console.error("[OrdersTable] Update status error:", error);
      alert("Status yenilənmədi");
    }
  };

  const deleteOrder = async (orderId: string | number) => {
    if (!confirm("Sifarişi silmək istədiyinizə əminsiniz?")) return;
    try {
      await orderApi.delete(orderId);
      await logAdminAction("ORDER_DELETED", { orderId });
      await loadOrders(false);
    } catch (error) {
      console.error("[OrdersTable] Delete error:", error);
      alert("Sifariş silinmədi");
    }
  };

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        if (searchQuery) {
          const user = users.find((u) => String(u.id) === String(order.userId));
          const query = searchQuery.toLowerCase();
          const matchesSearch =
            order.id.toString().toLowerCase().includes(query) ||
            (order.orderNumber || "").toLowerCase().includes(query) ||
            (user?.fullName || "").toLowerCase().includes(query) ||
            (user?.username || "").toLowerCase().includes(query) ||
            (order.items || []).some((i) => (i.productName || "").toLowerCase().includes(query));
          if (!matchesSearch) return false;
        }
        if (statusFilter !== "all" && order.status !== statusFilter) return false;
        if (userFilter !== "all" && String(order.userId) !== userFilter) return false;

        const amount = Number(order.totalAmount || 0);
        if (minAmount && amount < Number(minAmount)) return false;
        if (maxAmount && amount > Number(maxAmount)) return false;

        if (dateFilter !== "all") {
          const orderDate = new Date(order.createdAt);
          const now = new Date();
          const daysDiff = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
          if (dateFilter === "today" && daysDiff > 1) return false;
          if (dateFilter === "week" && daysDiff > 7) return false;
          if (dateFilter === "month" && daysDiff > 30) return false;
        }
        return true;
      }),
    [orders, users, searchQuery, statusFilter, userFilter, minAmount, maxAmount, dateFilter]
  );

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const exportToCsv = () => {
    const header = ["orderId", "orderNumber", "user", "username", "status", "totalAmount", "createdAt"];
    const rows = filteredOrders.map((order) => {
      const orderUser = users.find((u) => String(u.id) === String(order.userId));
      return [
        order.id,
        order.orderNumber || "",
        orderUser?.fullName || order.customerName || "Naməlum",
        orderUser?.username || "",
        order.status,
        Number(order.totalAmount || 0).toFixed(2),
        new Date(order.createdAt).toISOString(),
      ];
    });

    const content = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders-export-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1F2937] mb-6">Sifarişlər</h1>

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

      <Card className="p-4 mb-6">
        <div className="grid md:grid-cols-6 gap-4">
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
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg">
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
          <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg">
            <option value="all">Bütün istifadəçilər</option>
            {users.filter((u) => u.username !== "admin").map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName} (@{u.username})
              </option>
            ))}
          </select>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg">
            <option value="all">Bütün tarixlər</option>
            <option value="today">Bu gün</option>
            <option value="week">Son 7 gün</option>
            <option value="month">Son 30 gün</option>
          </select>
          <input type="number" min="0" placeholder="Min AZN" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg" />
          <input type="number" min="0" placeholder="Max AZN" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg" />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={exportToCsv}>
            CSV Export
          </Button>
          <Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />} onClick={() => void loadOrders()}>
            Yenilə
          </Button>
          <label className="inline-flex items-center gap-2 text-sm text-[#6B7280]">
            <input type="checkbox" checked={pollingEnabled} onChange={(e) => setPollingEnabled(e.target.checked)} />
            30s auto-yenilənmə
          </label>
        </div>
      </Card>

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
                  <td colSpan={7} className="py-12 text-center text-[#6B7280]">
                    Sifariş tapılmadı
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const orderUser = users.find((u) => String(u.id) === String(order.userId));
                  return (
                    <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">#{order.orderNumber || order.id}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{orderUser?.fullName || order.customerName || "Naməlum"}</p>
                        <p className="text-xs text-[#6B7280]">@{orderUser?.username || "-"}</p>
                      </td>
                      <td className="py-3 px-4">
                        {(order.items || []).slice(0, 2).map((item, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-gray-100 rounded mr-1">
                            {item.productName}
                          </span>
                        ))}
                      </td>
                      <td className="py-3 px-4 text-sm text-[#6B7280]">{new Date(order.createdAt).toLocaleDateString("az-AZ")}</td>
                      <td className="py-3 px-4 font-bold text-[#1F2937]">{order.totalAmount?.toFixed(2)} AZN</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <select value={order.status} onChange={(e) => void updateOrderStatus(order.id, e.target.value)} className="text-sm border border-gray-200 rounded px-2 py-1">
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
                          <button onClick={() => void deleteOrder(order.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Sil">
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
