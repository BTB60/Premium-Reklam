// src/app/admin/dashboard/components/NotificationsList.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Bell, Store, Package, CheckCircle, XCircle, Trash2, RefreshCw, AlertCircle } from "lucide-react";
import { storeRequests, type StoreRequest } from "@/lib/db";
import { orders, type Order } from "@/lib/db/orders";
import { notifications } from "@/lib/db/orders";

// Единый тип элемента очереди
interface QueueItem {
  id: string; // Внутренний ID с префиксом: store_123 / order_456
  rawId: string; // ✅ Чистый ID для работы с БД
  kind: "store_request" | "order_request";
  title: string;
  subtitle: string;
  amount?: number;
  createdAt: string;
  data: StoreRequest | Order;
}

export default function NotificationsList() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "stores" | "orders">("all");

  // ✅ Жесткая загрузка очереди из БД
  const loadQueue = useCallback(() => {
    try {
      // 1. Заявки на магазины (только pending)
      const pendingStores = storeRequests.getPending().map((r: StoreRequest) => ({
        id: `store_${r.id}`,
        rawId: r.id, // ✅ Сохраняем чистый ID
        kind: "store_request" as const,
        title: `Mağaza: ${r.name}`,
        subtitle: `Vend: ${r.vendorName || "Naməlum"} | Tel: ${r.phone || "-"}`,
        createdAt: r.createdAt,
        data: r,
      }));

      // 2. Новые заказы (только стадия "təsdiq")
      const allOrders = orders.getAll() || [];
      const pendingOrders = allOrders
        .filter((o: Order) => o.workflowStatus === "təsdiq")
        .map((o: Order) => ({
          id: `order_${o.id}`,
          rawId: o.id, // ✅ Сохраняем чистый ID
          kind: "order_request" as const,
          title: `Sifariş: #${o.orderNumber || o.id.slice(-4)}`,
          subtitle: `Müştəri: ${o.customerName || "Naməlum"}`,
          amount: o.finalTotal || o.totalAmount || 0,
          createdAt: o.createdAt,
          data: o,
        }));

      // Объединяем и сортируем по новизне
      const combined = [...pendingStores, ...pendingOrders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setQueue(combined);
    } catch (e) {
      console.error("[NotificationsList] Load error:", e);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  // Кросс-таб синхронизация
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "decor_store_requests" || e.key === "decor_orders") {
        loadQueue();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [loadQueue]);

  // Обновление Megaphone-индикатора
  const refreshBell = () => {
    if ((window as any).__adminBellRefresh) {
      (window as any).__adminBellRefresh();
    }
  };

  // ✅ Одобрение заявки — ИСПРАВЛЕНО: используем rawId
  const handleApprove = async (item: QueueItem) => {
    setProcessingId(item.id);
    try {
      const adminId = JSON.parse(localStorage.getItem("decor_current_user") || "{}")?.id || "admin-1";

      if (item.kind === "store_request") {
        // ✅ ИСПРАВЛЕНО: передаём item.rawId, а не item.id
        const result = storeRequests.approve(item.rawId, adminId);
        if (result) {
          notifications.create({
            userId: (item.data as StoreRequest).vendorId,
            title: "Mağaza təsdiqləndi",
            message: `"${(item.data as StoreRequest).name}" mağazanız aktivləşdirildi.`,
            type: "system",
          });
        } else {
          throw new Error("Mağaza təsdiqlənmədi");
        }
      } else {
        // ✅ ИСПРАВЛЕНО: передаём item.rawId
        const result = orders.updateWorkflowStatus(item.rawId, "ödəniş");
        if (result) {
          notifications.create({
            userId: (item.data as Order).userId,
            title: "Sifariş qəbul edildi",
            message: `#${(item.data as Order).orderNumber || (item.data as Order).id.slice(-4)} istehsalata götürüldü.`,
            type: "system",
          });
        } else {
          throw new Error("Sifariş təsdiqlənmədi");
        }
      }

      loadQueue();
      refreshBell();
    } catch (e: any) {
      console.error("[NotificationsList] Approve error:", e);
      alert(e.message || "Təsdiqləmə uğursuz oldu");
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ Отклонение заявки — ИСПРАВЛЕНО: используем rawId
  const handleReject = async (item: QueueItem) => {
    const reason = prompt("Rədd etmə səbəbi (opsional):") || "";
    setProcessingId(item.id);
    try {
      const adminId = JSON.parse(localStorage.getItem("decor_current_user") || "{}")?.id || "admin-1";

      if (item.kind === "store_request") {
        // ✅ ИСПРАВЛЕНО: передаём item.rawId
        const result = storeRequests.reject(item.rawId, adminId, reason || undefined);
        if (!result) throw new Error("Rədd etmə uğursuz oldu");
      } else {
        // ✅ ИСПРАВЛЕНО: передаём item.rawId
        const result = orders.updateWorkflowStatus(item.rawId, "cancelled");
        if (!result) throw new Error("Ləğv etmə uğursuz oldu");
      }

      loadQueue();
      refreshBell();
    } catch (e: any) {
      console.error("[NotificationsList] Reject error:", e);
      alert(e.message || "Rədd etmə uğursuz oldu");
    } finally {
      setProcessingId(null);
    }
  };

  // Фильтрация отображения
  const filteredQueue = queue.filter(item => {
    if (filter === "stores" && item.kind !== "store_request") return false;
    if (filter === "orders" && item.kind !== "order_request") return false;
    return true;
  });

  const stats = {
    total: queue.length,
    stores: queue.filter(i => i.kind === "store_request").length,
    orders: queue.filter(i => i.kind === "order_request").length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-[#D90429]" />
          <div>
            <h1 className="text-2xl font-bold text-[#1F2937]">Bildirişlər / Təsdiq Gözləyənlər</h1>
            <p className="text-sm text-[#6B7280]">Yeni mağaza və sifariş müraciətləri</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#D90429]/10 text-[#D90429] rounded-full text-sm font-medium">
          <AlertCircle className="w-4 h-4" />
          Gözləyən: {stats.total}
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-[#6B7280] text-sm">Ümumi</p>
          <p className="text-2xl font-bold text-[#1F2937]">{stats.total}</p>
        </Card>
        <Card className="p-4 bg-amber-50">
          <p className="text-amber-600 text-sm">Mağaza</p>
          <p className="text-2xl font-bold text-amber-700">{stats.stores}</p>
        </Card>
        <Card className="p-4 bg-blue-50">
          <p className="text-blue-600 text-sm">Sifariş</p>
          <p className="text-2xl font-bold text-blue-700">{stats.orders}</p>
        </Card>
      </div>

      {/* Фильтры */}
      <Card className="p-4 mb-6">
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-[#D90429] hover:bg-[#D90429]/90" : ""}
          >
            Hamısı
          </Button>
          <Button
            variant={filter === "stores" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("stores")}
            className={filter === "stores" ? "bg-amber-600 hover:bg-amber-700" : ""}
          >
            Mağaza
          </Button>
          <Button
            variant={filter === "orders" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("orders")}
            className={filter === "orders" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            Sifariş
          </Button>
        </div>
      </Card>

      {/* Список очереди */}
      {loading ? (
        <Card className="p-12 flex items-center justify-center gap-3 text-[#6B7280]">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Yüklenir...
        </Card>
      ) : filteredQueue.length === 0 ? (
        <Card className="p-16 text-center text-[#6B7280]">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Gözləyən müraciət yoxdur</p>
          <p className="text-sm mt-1">Yeni sifariş və ya mağaza müraciəti gələndə burada görünəcək</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredQueue.map((item) => (
            <Card
              key={item.id}
              className={`p-4 border-l-4 transition-all ${
                item.kind === "store_request" ? "border-l-amber-500" : "border-l-blue-500"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    item.kind === "store_request" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {item.kind === "store_request" ? <Store className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1F2937]">{item.title}</h3>
                    <p className="text-sm text-[#6B7280]">{item.subtitle}</p>
                    {item.amount !== undefined && (
                      <p className="text-sm font-medium text-[#D90429] mt-1">{item.amount.toFixed(2)} AZN</p>
                    )}
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      {new Date(item.createdAt).toLocaleString("az-AZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[160px]">
                  <Button
                    onClick={() => handleApprove(item)}
                    disabled={processingId === item.id}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-xs py-2"
                    icon={processingId === item.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  >
                    {item.kind === "order_request" ? "İstehsalata götürülsün" : "Təsdiqlə"}
                  </Button>
                  <Button
                    onClick={() => handleReject(item)}
                    disabled={processingId === item.id}
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 text-xs py-2"
                    icon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    Rədd et
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}