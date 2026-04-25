// src/app/dashboard/orders/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { orders as ordersDb } from "@/lib/db/orders"; // ✅ Прямой импорт из DB
import { auth } from "@/lib/db/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CompactOrderTimeline } from "@/components/ui/OrderTimeline";
import { formatReadyCountdown, shouldShowReadyCountdown } from "@/lib/orderDelay";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, DollarSign, CheckCircle, RefreshCw, Package, X, Wallet, Trash2, Edit3, Phone, Timer
} from "lucide-react";

export default function OrdersListPage() {
  const router = useRouter();
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0); // ✅ Триггер для принудительной перезагрузки
  const [nowMs, setNowMs] = useState(() => Date.now());

  // ✅ Модальное окно-заглушка для оплаты
  const [showPaymentStub, setShowPaymentStub] = useState(false);

  // ✅ Чтение заказов НАПРЯМУЮ из локальной БД (как в админке)
  const loadOrders = useCallback(() => {
    try {
      const currentUser = auth.getCurrentUser();
      if (!currentUser) {
        setUserOrders([]);
        return;
      }
      
      // Прямой запрос к DB, без API-прослойки
      const myOrders = ordersDb.getByUserId(currentUser.id);
      setUserOrders(myOrders);
    } catch (e) {
      console.error("[OrdersListPage] Load error:", e);
      setUserOrders([]);
    } finally {
      setLoading(false);
    }
  }, [reloadKey]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // ✅ Кросс-таб синхронизация: мгновенное обновление при изменении decor_orders
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "decor_orders") {
        loadOrders();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [loadOrders]);

  // ✅ Экспорт функции обновления для вызова из других мест (опционально)
  useEffect(() => {
    (window as any).__userOrdersRefresh = () => setReloadKey(k => k + 1);
    return () => { delete (window as any).__userOrdersRefresh; };
  }, []);

  const handleDeleteOrder = async (orderId: string | number, orderNumber: string) => {
    if (!confirm(`Sifariş #${orderNumber} silinsin? Bu əməliyyatı geri qaytarmaq olmaz.`)) return;
    
    try {
      const result = ordersDb.delete(String(orderId));
      if (result) {
        loadOrders();
        // Обновляем колокольчик админа, если открыт в другой вкладке
        if ((window as any).__adminBellRefresh) {
          (window as any).__adminBellRefresh();
        }
      } else {
        alert("Sifariş silinmədi");
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(error.message || "Sifariş silinmədi. Admin ilə əlaqə saxlayın.");
    }
  };

  // ✅ Показ заглушки оплаты
  const handlePayStub = (orderId: string | number) => {
    setShowPaymentStub(true);
  };

  // Хелпер для безопасного доступа к полям
  const getFieldValue = (order: any, camel: string, snake: string, fallback: any = "") => {
    return order[camel] !== undefined ? order[camel] : order[snake] !== undefined ? order[snake] : fallback;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1F2937]">Sifarişlərim</h1>
        <Button onClick={() => router.push("/orders/new")} icon={<Plus className="w-4 h-4" />}>
          Yeni Sifariş
        </Button>
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
            
            // ✅ Читаем workflowStatus напрямую из БД
            const status = String(getFieldValue(order, "workflowStatus", "status", "pending")).toLowerCase();
            const paymentStatusRaw = String(getFieldValue(order, "paymentStatus", "payment_status", "pending")).toLowerCase();
            const orderNumber = getFieldValue(order, "orderNumber", "order_number", order.id?.toString().slice(-4) || "");
            const canDelete = paymentStatusRaw !== "paid" && paymentStatusRaw !== "cancelled";
            const estimatedReadyAt = getFieldValue(order, "estimatedReadyAt", "estimated_ready_at", null);
            const showCountdown = shouldShowReadyCountdown({ status, estimatedReadyAt });
            const countdown = showCountdown ? formatReadyCountdown(estimatedReadyAt, nowMs) : "";

            return (
              <Card key={order.id} className="p-5 hover:shadow-md transition-shadow relative group">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteOrder(order.id, orderNumber)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sifarişi sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
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
                      onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                      className="font-bold text-[#D90429] text-lg hover:underline text-left"
                    >
                      #{orderNumber}
                    </button>
                    <p className="text-sm text-[#6B7280]">
                      {new Date(order.createdAt).toLocaleString("az-AZ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* ✅ Статус читается из БД и отображается через StatusBadge */}
                    <StatusBadge status={status} />
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      paymentStatusRaw === "paid" ? "bg-green-100 text-green-700" :
                      paymentStatusRaw === "partial" ? "bg-orange-100 text-orange-700" :
                      paymentStatusRaw === "cancelled" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {paymentStatusRaw === "paid" ? "Ödənilib" :
                       paymentStatusRaw === "partial" ? "Qismən" :
                       paymentStatusRaw === "cancelled" ? "Ləğv" : "Gözləyir"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items?.map((item: any, idx: number) => {
                    const width = Number(getFieldValue(item, "width", "width", 0));
                    const height = Number(getFieldValue(item, "height", "height", 0));
                    const area = Number(getFieldValue(item, "area", "area", width * height));
                    const qty = Number(getFieldValue(item, "quantity", "quantity", 1));
                    const lineTotal = Number(getFieldValue(item, "lineTotal", "line_total", item.totalPrice || 0));
                    return (
                      <div key={idx} className="text-sm bg-[#F9FAFB] rounded-lg p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[#1F2937] font-medium">
                            {getFieldValue(item, "productName", "product_name")}
                          </span>
                          <span className="font-semibold text-[#1F2937]">{lineTotal.toFixed(2)} AZN</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#6B7280]">
                          {width > 0 && <span className="px-2 py-1 bg-white rounded border border-gray-100">En: {width} m</span>}
                          {height > 0 && <span className="px-2 py-1 bg-white rounded border border-gray-100">Hündürlük: {height} m</span>}
                          {area > 0 && <span className="px-2 py-1 bg-white rounded border border-gray-100">Sahə: {area.toFixed(2)} m²</span>}
                          {qty > 1 && <span className="px-2 py-1 bg-white rounded border border-gray-100">Say: {qty}</span>}
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
                    <p className="font-semibold text-[#1F2937]">{getFieldValue(order, "customerName", "customer_name", "Naməlum")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#6B7280]">Ümumi</p>
                    <p className="text-xl font-bold text-[#D90429]">{total.toFixed(2)} AZN</p>
                  </div>
                </div>

                {/* Бонусная информация */}
                {bonusUsed > 0 && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-blue-600" />
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
                    {(paymentStatusRaw !== "paid" && paymentStatusRaw !== "cancelled" && remaining > 0) && (
                      <button
                        onClick={() => handlePayStub(order.id)}
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
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ✅ Модальное окно-заглушка для оплаты */}
      <AnimatePresence>
        {showPaymentStub && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPaymentStub(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-[#D90429]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-[#D90429]" />
              </div>
              
              <h3 className="text-xl font-bold text-[#1F2937] mb-2">Ödəniş Məlumatı</h3>
              
              <p className="text-[#6B7280] mb-6">
                Ödəniş üçün saytın administratoru ilə əlaqə saxlayın.
              </p>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-[#6B7280] mb-1">Əlaqə:</p>
                <p className="font-semibold text-[#1F2937]">WhatsApp / Telefon</p>
                <p className="text-lg font-bold text-[#D90429]">+994 XX XXX XX XX</p>
              </div>

              <Button
                onClick={() => setShowPaymentStub(false)}
                className="w-full"
                variant="outline"
              >
                Bağla
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}