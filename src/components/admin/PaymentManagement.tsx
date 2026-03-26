"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  XCircle,
  Eye,
  Plus,
  Minus,
  RefreshCw,
  Calendar,
  Download,
  CreditCard,
  Banknote,
  QrCode
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { authApi, orderApi } from "@/lib/authApi";

// Type for API response (camelCase from Spring Boot)
type ApiOrder = any;

interface PaymentManagementProps {
  allUsers: any[];
  onRefresh: () => void;
}

type PaymentStatus = "PENDING" | "PARTIAL" | "PAID" | "CANCELLED";
type DateFilter = "today" | "week" | "month" | "all";

export function PaymentManagement({ allUsers, onRefresh }: PaymentManagementProps) {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUser, setFilterUser] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<PaymentStatus | "all">("all");
  const [filterDate, setFilterDate] = useState<DateFilter>("all");
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentNote, setPaymentNote] = useState("");
  const [processing, setProcessing] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalDebt: 0,
    pendingCount: 0,
    partialCount: 0,
    paidCount: 0,
    totalOrders: 0,
  });

  useEffect(() => {
    loadOrders();
  }, [filterUser, filterPaymentStatus, filterDate]);

  const getDateFilter = (): { dateFrom?: string; dateTo?: string } => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    switch (filterDate) {
      case "today":
        return { dateFrom: formatDate(today), dateTo: formatDate(today) };
      case "week":
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { dateFrom: formatDate(weekAgo), dateTo: formatDate(today) };
      case "month":
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { dateFrom: formatDate(monthAgo), dateTo: formatDate(today) };
      default:
        return {};
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const filters = {
        ...(filterUser !== "all" && { userId: filterUser }),
        ...(filterPaymentStatus !== "all" && { paymentStatus: filterPaymentStatus }),
        ...getDateFilter(),
      };
      
      // Use Vercel API (Neon DB) instead of Render backend
      const data = await orderApi.getOrdersFromBackend(filters);
      const ordersList = data.orders || [];
      setOrders(ordersList as unknown as ApiOrder[]);

      // Calculate stats from orders
      setStats({
        totalDebt: ordersList.reduce((sum: number, o: any) => sum + Number(o.remaining_amount || 0), 0),
        pendingCount: ordersList.filter((o: any) => o.payment_status === "PENDING" || !o.payment_status).length,
        partialCount: ordersList.filter((o: any) => o.payment_status === "PARTIAL").length,
        paidCount: ordersList.filter((o: any) => o.payment_status === "PAID" && o.status !== "cancelled").length,
        totalOrders: ordersList.length,
      });
    } catch (error) {
      console.error("Load orders error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchLower) ||
      order.customerName?.toLowerCase().includes(searchLower) ||
      order.userFullName?.toLowerCase().includes(searchLower) ||
      order.userUsername?.toLowerCase().includes(searchLower) ||
      order.customerPhone?.includes(searchTerm);
    return matchesSearch;
  });

  const handlePayment = async () => {
    if (!selectedOrder || !paymentAmount) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Düzgün məbləğ daxil edin");
      return;
    }

    const currentPaid = Number(selectedOrder.paid_amount || 0);
    const totalAmount = Number(selectedOrder.totalAmount || 0);
    const maxAllowed = totalAmount - currentPaid;

    if (amount > maxAllowed) {
      alert(`Maksimum ${maxAllowed.toFixed(2)} AZN ödəniş edilə bilər`);
      return;
    }

    setProcessing(true);
    try {
      // Use new Vercel API Route for payment
      const result = await orderApi.adminPayment(
        selectedOrder.id,
        amount,
        paymentMethod,
        paymentNote || 'Admin ödənişi'
      );
      
      if (result.success) {
        alert(result.message || "Ödəniş qeydə alındı!");
        setShowPaymentModal(false);
        setPaymentAmount("");
        setPaymentNote("");
        loadOrders();
        onRefresh();
      } else {
        alert(result.message || "Ödəniş xətası");
      }
    } catch (error: any) {
      alert(error.message || "Ödəniş xətası");
    } finally {
      setProcessing(false);
    }
  };

  const handleSetPaid = async (order: ApiOrder) => {
    if (!confirm("Sifarişi tam ödənilib olaraq qeyd etmək istəyirsiniz?")) return;
    
    const remainingAmount = Number(order.remaining_amount || 0);
    if (remainingAmount <= 0) {
      alert("Sifariş artıq tam ödənilib");
      return;
    }
    
    setProcessing(true);
    try {
      const result = await orderApi.adminPayment(
        order.id,
        remainingAmount,
        "CASH",
        "Tam ödəniş"
      );
      
      if (result.success) {
        loadOrders();
        onRefresh();
      } else {
        alert(result.message || "Xəta");
      }
    } catch (error: any) {
      alert(error.message || "Xəta");
    } finally {
      setProcessing(false);
    }
  };

  const handleSetPending = async (order: ApiOrder) => {
    if (!confirm("Sifarişi gözləyir statusuna qaytarmaq istəyirsiniz?")) return;
    
    setProcessing(true);
    try {
      await orderApi.updatePayment(order.id, 0, "CASH", "Gözləyir");
      loadOrders();
      onRefresh();
    } catch (error: any) {
      alert(error.message || "Xəta");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async (order: ApiOrder) => {
    if (!confirm("Sifarişi ləğv etmək istəyirsiniz?")) return;
    
    setProcessing(true);
    try {
      await orderApi.updateStatus(order.id, "cancelled");
      loadOrders();
      onRefresh();
    } catch (error: any) {
      alert(error.message || "Xəta");
    } finally {
      setProcessing(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: "bg-yellow-100 text-yellow-700", text: "Gözləyir", label: "Gözləyir" },
      PARTIAL: { bg: "bg-orange-100 text-orange-700", text: "Qismən", label: "Qismən ödənib" },
      PAID: { bg: "bg-green-100 text-green-700", text: "Ödənilib", label: "Tam ödənilib" },
      CANCELLED: { bg: "bg-red-100 text-red-700", text: "Ləğv", label: "Ləğv edilib" },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getOrderStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: "bg-gray-100 text-gray-600", text: "Gözləyir", label: "Gözləyir" },
      approved: { bg: "bg-blue-100 text-blue-700", text: "Təsdiqləndi", label: "Təsdiqləndi" },
      confirmed: { bg: "bg-blue-100 text-blue-700", text: "Təsdiqləndi", label: "Təsdiqləndi" },
      production: { bg: "bg-purple-100 text-purple-700", text: "İstehsal", label: "İstehsal" },
      printing: { bg: "bg-indigo-100 text-indigo-700", text: "Çap", label: "Çap" },
      ready: { bg: "bg-teal-100 text-teal-700", text: "Hazır", label: "Hazırdır" },
      delivering: { bg: "bg-cyan-100 text-cyan-700", text: "Çatdırılır", label: "Çatdırılır" },
      completed: { bg: "bg-green-100 text-green-700", text: "Tamamlandı", label: "Tamamlandı" },
      cancelled: { bg: "bg-red-100 text-red-700", text: "Ləğv", label: "Ləğv edildi" },
    };
    const badge = badges[status.toLowerCase()] || badges.pending;
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1F2937]">Ödəniş İdarəetməsi</h2>
        <Button onClick={loadOrders} variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />}>
          Yenilə
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Ümumi Borc</p>
              <p className="text-lg font-bold text-red-600">{stats.totalDebt.toFixed(2)} AZN</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Gözləyən</p>
              <p className="text-lg font-bold text-yellow-600">{stats.pendingCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Qismən</p>
              <p className="text-lg font-bold text-orange-600">{stats.partialCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Ödənilib</p>
              <p className="text-lg font-bold text-green-600">{stats.paidCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Cəmi Sifariş</p>
              <p className="text-lg font-bold text-blue-600">{stats.totalOrders}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Axtar... (sifariş no, müştəri)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]/20 focus:border-[#D90429]"
            />
          </div>
          
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]/20"
          >
            <option value="all">Bütün istifadəçilər</option>
            {allUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName || user.username}
              </option>
            ))}
          </select>

          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value as any)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]/20"
          >
            <option value="all">Bütün ödəniş statusları</option>
            <option value="PENDING">Gözləyir</option>
            <option value="PARTIAL">Qismən ödənib</option>
            <option value="PAID">Tam ödənilib</option>
            <option value="CANCELLED">Ləğv edilib</option>
          </select>

          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value as DateFilter)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]/20"
          >
            <option value="all">Bütün dövrlər</option>
            <option value="today">Bu gün</option>
            <option value="week">Bu həftə</option>
            <option value="month">Bu ay</option>
          </select>
        </div>
      </Card>

      {/* Orders Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D90429]" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Sifariş tapılmadı</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sifariş</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Müştəri</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">İstifadəçi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tarix</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Məbləğ</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Ödənilib</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Qalan</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Ödəniş</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const isCancelled = order.payment_status === "CANCELLED";
                  return (
                    <tr key={order.id} className={`hover:bg-gray-50 ${isCancelled ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[#D90429]">#{order.order_number}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{order.customer_name}</p>
                        <p className="text-xs text-gray-500">{order.customer_phone || "-"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">{order.user_name || order.user_username || "-"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString("az-AZ")}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-gray-900">
                          {Number(order.total_amount || 0).toFixed(2)} AZN
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-green-600">
                          {Number(order.paid_amount || 0).toFixed(2)} AZN
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${Number(order.remaining_amount || 0) > 0 ? "text-red-600" : "text-gray-400"}`}>
                          {Number(order.remaining_amount || 0).toFixed(2)} AZN
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getPaymentStatusBadge(order.payment_status)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getOrderStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowPaymentModal(true);
                            }}
                            disabled={isCancelled}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                            title="Ödəniş et"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                          {!isCancelled && Number(order.remaining_amount || 0) > 0 && (
                            <button
                              onClick={() => handleSetPaid(order)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Tam ödənildi et"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {!isCancelled && Number(order.remaining_amount || 0) === 0 && order.payment_status !== "PENDING" && (
                            <button
                              onClick={() => handleSetPending(order)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                              title="Gözləyir et"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          {!isCancelled && (
                            <button
                              onClick={() => handleCancel(order)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Ləğv et"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-md p-6"
          >
            <h3 className="text-xl font-bold text-[#1F2937] mb-4">Ödəniş Et</h3>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Sifariş:</span>
                <span className="font-bold text-[#D90429]">#{selectedOrder.order_number}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Ümumi məbləğ:</span>
                <span className="font-bold">{Number(selectedOrder.total_amount || 0).toFixed(2)} AZN</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Ödənilib:</span>
                <span className="font-semibold text-green-600">{Number(selectedOrder.paid_amount || 0).toFixed(2)} AZN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Qalan:</span>
                <span className="font-bold text-red-600">
                  {(Number(selectedOrder.total_amount || 0) - Number(selectedOrder.paid_amount || 0)).toFixed(2)} AZN
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ödəniş məbləği (AZN)</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D90429]/20 focus:border-[#D90429]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ödəniş üsulu</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "CASH", label: "Nağd", icon: Banknote },
                    { value: "CARD", label: "Kart", icon: CreditCard },
                    { value: "TRANSFER", label: " Köçürmə", icon: QrCode },
                  ].map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-colors ${
                        paymentMethod === method.value
                          ? "border-[#D90429] bg-[#D90429]/5 text-[#D90429]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <method.icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Qeyd (istəyə bağlı)</label>
                <textarea
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Əlavə qeyd..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D90429]/20 focus:border-[#D90429]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentAmount("");
                  setPaymentNote("");
                }}
                className="flex-1"
              >
                Ləğv
              </Button>
              <Button
                onClick={handlePayment}
                disabled={processing || !paymentAmount}
                className="flex-1"
                icon={processing ? <RefreshCw className="animate-spin w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
              >
                {processing ? "Gözləyin..." : "Ödəniş Et"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
