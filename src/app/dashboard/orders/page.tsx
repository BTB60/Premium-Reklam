"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { orderApi } from "@/lib/authApi";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CompactOrderTimeline } from "@/components/ui/OrderTimeline";
import { formatReadyCountdown, shouldShowReadyCountdown } from "@/lib/orderDelay";
import { playPremiumNotificationSound } from "@/lib/notificationSound";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  DollarSign,
  CheckCircle,
  RefreshCw,
  Package,
  X,
  Trash2,
  Edit3,
  Timer,
  Repeat,
} from "lucide-react";

function getFieldValue(order: any, camel: string, snake: string, fallback: any = "") {
  return order[camel] !== undefined ? order[camel] : order[snake] !== undefined ? order[snake] : fallback;
}

function paymentStatusKey(raw: string): string {
  return String(raw || "").toLowerCase();
}

export default function OrdersListPage() {
  const router = useRouter();
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState<string | number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderApi.getMyOrders();
      const rows = (res as any)?.orders || [];
      setUserOrders(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error("[OrdersListPage] load error", e);
      setUserOrders([]);
    } finally {
      setLoading(false);
    }
  }, [reloadKey]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    (window as unknown as { __userOrdersRefresh?: () => void }).__userOrdersRefresh = () =>
      setReloadKey((k) => k + 1);
    return () => {
      delete (window as unknown as { __userOrdersRefresh?: () => void }).__userOrdersRefresh;
    };
  }, []);

  const handleDeleteOrder = async (orderId: string | number, orderNumber: string) => {
    if (!confirm(`Sifariş #${orderNumber} silinsin? Bu əməliyyatı geri qaytarmaq olmaz.`)) return;
    try {
      await orderApi.delete(orderId);
      await loadOrders();
      if ((window as any).__adminBellRefresh) (window as any).__adminBellRefresh();
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(error?.message || "Sifariş silinmədi");
    }
  };

  const openPayModal = (orderId: string | number) => {
    setPaymentOrderId(orderId);
    setPaymentAmount("");
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!paymentOrderId || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      alert("Düzgün məbləğ daxil edin");
      return;
    }
    const order = userOrders.find((o: any) => o.id === paymentOrderId);
    if (!order) return;
    const remaining = Number(order.remaining_amount || order.remainingAmount || 0);
    if (amount > remaining) {
      alert(`Maksimum ${remaining.toFixed(2)} AZN ödəniş edilə bilər`);
      return;
    }
    setPaymentProcessing(true);
    try {
      await orderApi.addPayment(paymentOrderId, amount, "CASH", "Müştəri ödənişi");
      playPremiumNotificationSound();
      alert("Ödəniş uğurla qeydə alındı!");
      setShowPaymentModal(false);
      setReloadKey((k) => k + 1);
    } catch (error: any) {
      alert(error?.message || "Ödəniş xətası");
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleReorder = (order: any) => {
    const firstItem = order?.items?.[0];
    const pid = firstItem?.productId || firstItem?.product_id;
    if (pid) {
      router.push(`/orders/new?productId=${encodeURIComponent(String(pid))}`);
      return;
    }
    alert("Təkrar sifariş üçün məhsul ID tapılmadı");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1F2937]">Sifarişlərim</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-[#D90429]" />
        </div>
      ) : userOrders.length === 0 ? (
        <Card className="p-16 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1F2937] mb-2">Sifariş yoxdur</h3>
          <p className="text-[#6B7280] mb-6">İlk sifarişinizi verin</p>
          <Button onClick={() => router.push("/orders/new")} icon={<Plus className="w-4 h-4" />}>
            Sifariş Et
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {userOrders.map((order) => {
            const remaining = Number(getFieldValue(order, "remainingAmount", "remaining_amount", 0));
            const paid = Number(getFieldValue(order, "paidAmount", "paid_amount", 0));
            const total = Number(getFieldValue(order, "finalTotal", "totalAmount", 0));
            const bonusUsed = Number(getFieldValue(order, "bonusUsed", "bonus_used", 0));
            const status = String(getFieldValue(order, "workflowStatus", "status", "pending")).toLowerCase();
            const paymentStatusRaw = paymentStatusKey(
              getFieldValue(order, "paymentStatus", "payment_status", "pending")
            );
            const orderNumber = getFieldValue(order, "orderNumber", "order_number", String(order.id || ""));
            const canDelete = paymentStatusRaw !== "paid" && paymentStatusRaw !== "cancelled";
            const estimatedReadyAt = getFieldValue(order, "estimatedReadyAt", "estimated_ready_at", null);
            const showCountdown = shouldShowReadyCountdown({ status, estimatedReadyAt });
            const countdown = showCountdown ? formatReadyCountdown(estimatedReadyAt, nowMs) : "";
            const decorName =
              getFieldValue(order, "decorName", "decor_name", "") ||
              getFieldValue(order, "customerName", "customer_name", "Naməlum");

            return (
              <Card key={order.id} className="p-5 hover:shadow-md transition-shadow relative group">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteOrder(order.id, orderNumber)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sifarişi sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled
                    className="p-2 text-gray-300 cursor-not-allowed"
                    title="Redaktə tezliklə əlavə olunacaq"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-start justify-between mb-4 pr-12">
                  <div>
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                      className="font-bold text-[#D90429] text-lg hover:underline text-left"
                    >
                      #{orderNumber}
                    </button>
                    <p className="text-sm text-[#6B7280]">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString("az-AZ") : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={status} />
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        paymentStatusRaw === "paid"
                          ? "bg-green-100 text-green-700"
                          : paymentStatusRaw === "partial"
                            ? "bg-orange-100 text-orange-700"
                            : paymentStatusRaw === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {paymentStatusRaw === "paid"
                        ? "Ödənilib"
                        : paymentStatusRaw === "partial"
                          ? "Qismən"
                          : paymentStatusRaw === "cancelled"
                            ? "Ləğv"
                            : "Gözləyir"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items?.map((item: any, idx: number) => {
                    const width = Number(getFieldValue(item, "width", "width", 0));
                    const height = Number(getFieldValue(item, "height", "height", 0));
                    const area = Number(getFieldValue(item, "area", "area", width * height));
                    const qty = Number(getFieldValue(item, "quantity", "quantity", 1));
                    const lineTotal = Number(
                      getFieldValue(item, "lineTotal", "line_total", item.totalPrice || 0)
                    );
                    return (
                      <div key={idx} className="text-sm bg-[#F9FAFB] rounded-lg p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[#1F2937] font-medium">
                            {getFieldValue(item, "productName", "product_name")}
                          </span>
                          <span className="font-semibold text-[#1F2937]">{lineTotal.toFixed(2)} AZN</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#6B7280]">
                          {width > 0 && (
                            <span className="px-2 py-1 bg-white rounded border border-gray-100">En: {width} m</span>
                          )}
                          {height > 0 && (
                            <span className="px-2 py-1 bg-white rounded border border-gray-100">
                              Hündürlük: {height} m
                            </span>
                          )}
                          {area > 0 && (
                            <span className="px-2 py-1 bg-white rounded border border-gray-100">
                              Sahə: {area.toFixed(2)} m²
                            </span>
                          )}
                          {qty > 1 && (
                            <span className="px-2 py-1 bg-white rounded border border-gray-100">Say: {qty}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <CompactOrderTimeline status={status} className="mb-4" />

                {showCountdown && countdown && (
                  <div
                    className={`mb-4 flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm ${
                      countdown.startsWith("Gecikir")
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-[#D90429]/5 border-[#D90429]/15 text-[#1F2937]"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 font-medium">
                      <Timer className="w-4 h-4" />
                      Təhvil geri sayımı
                    </span>
                    <span className="font-bold">{countdown}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                  <div>
                    <p className="text-sm text-[#6B7280]">Dekor adı</p>
                    <p className="font-semibold text-[#1F2937]">{decorName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#6B7280]">Ümumi</p>
                    <p className="text-xl font-bold text-[#D90429]">{total.toFixed(2)} AZN</p>
                  </div>
                </div>

                {bonusUsed > 0 && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2">
                    <span className="text-sm text-blue-800 font-medium">
                      Bonusla ödənilib: <span className="font-bold">{bonusUsed.toFixed(2)} AZN</span>
                    </span>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-[#6B7280]">Ödənilib</p>
                      <p className="text-lg font-bold text-green-600">{paid.toFixed(2)} AZN</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-xs text-[#6B7280]">Qalan</p>
                      <p className="text-lg font-bold text-red-600">{remaining.toFixed(2)} AZN</p>
                    </div>
                    {paymentStatusRaw !== "paid" && paymentStatusRaw !== "cancelled" && remaining > 0 && (
                      <button
                        type="button"
                        onClick={() => openPayModal(order.id)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#16A34A] to-[#15803D] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition-all"
                      >
                        <DollarSign className="w-5 h-5" />
                        <span>Ödə</span>
                      </button>
                    )}
                    {paymentStatusRaw === "paid" && (
                      <div className="flex items-center justify-center gap-2 p-3 bg-green-100 rounded-lg col-span-1">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">Tam</span>
                      </div>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleReorder(order)} icon={<Repeat className="w-4 h-4" />}>
                    Təkrar sifariş
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#1F2937]">Ödəniş</h3>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              {(() => {
                const order = userOrders.find((o: any) => o.id === paymentOrderId);
                if (!order) return null;
                const rem = Number(order.remaining_amount || order.remainingAmount || 0);
                return (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sifariş</span>
                        <span className="font-bold text-[#D90429]">
                          #{order.orderNumber || order.order_number || order.id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Qalıq borc</span>
                        <span className="font-bold text-red-600">{rem.toFixed(2)} AZN</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Məbləğ (AZN)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D90429]/20 focus:border-[#D90429]"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button variant="ghost" onClick={() => setShowPaymentModal(false)} className="flex-1">
                        Ləğv
                      </Button>
                      <Button
                        onClick={() => void handlePaymentSubmit()}
                        disabled={paymentProcessing || !paymentAmount}
                        className="flex-1 bg-gradient-to-r from-[#16A34A] to-[#15803D]"
                        icon={
                          paymentProcessing ? (
                            <RefreshCw className="animate-spin w-4 h-4" />
                          ) : (
                            <DollarSign className="w-4 h-4" />
                          )
                        }
                      >
                        {paymentProcessing ? "Gözləyin..." : "Ödəniş et"}
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
