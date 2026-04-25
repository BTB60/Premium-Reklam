// src/app/admin/dashboard/components/AdminNotificationBell.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Store, Package, ChevronRight, Bell } from "lucide-react";
import { storeRequests, type StoreRequest } from "@/lib/db";
import { orders, type Order } from "@/lib/db/orders";
import { getAdminMockPendingActivityTotal } from "@/lib/adminPendingActivity";

export default function AdminNotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [badgeCount, setBadgeCount] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  // ✅ Жесткая перезагрузка событий из БД при каждом вызове
  const loadEvents = useCallback(() => {
    try {
      // 1. Заявки на магазины (только pending)
      const pendingRequests = storeRequests.getPending() || [];
      const requestEvents = pendingRequests.map((r: StoreRequest) => ({
        id: `req_${r.id}`,
        type: "store_request" as const,
        title: "Yeni mağaza müraciəti",
        subtitle: `${r.vendorName || "İstifadəçi"} → ${r.name}`,
        createdAt: r.createdAt,
        requestId: r.id,
      }));

      // 2. Новые заказы (только стадия "təsdiq")
      const allOrders = orders.getAll() || [];
      const newOrders = allOrders.filter((o: Order) => o.workflowStatus === "təsdiq");
      const orderEvents = newOrders.map((o: Order) => ({
        id: `ord_${o.id}`,
        type: "new_order" as const,
        title: "Yeni sifariş",
        subtitle: `#${o.orderNumber || o.id.slice(-6)} | ${(o.finalTotal || o.totalAmount || 0).toFixed(2)} AZN`,
        createdAt: o.createdAt,
        orderId: o.id,
      }));

      // Сортировка по новизне
      const all = [...requestEvents, ...orderEvents].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setEvents(all);
      setBadgeCount(getAdminMockPendingActivityTotal());
    } catch (e) {
      console.error("[AdminBell] Load error:", e);
      setEvents([]);
      setBadgeCount(0);
    }
  }, [reloadKey]);

  // Инициализация и кросс-таб синхронизация
  useEffect(() => { loadEvents(); }, [loadEvents]);
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "decor_store_requests" || e.key === "decor_orders") {
        loadEvents();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [loadEvents]);

  // Экспорт для ручного вызова из таблиц
  useEffect(() => {
    (window as any).__adminBellRefresh = () => {
      setReloadKey((k) => k + 1);
      loadEvents();
    };
    return () => { delete (window as any).__adminBellRefresh; };
  }, [loadEvents]);

  // ✅ Навигация через CustomEvent (синхронизация с page.tsx)
  const navigateToNotifications = () => {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent("admin-navigate", { 
      detail: { tab: "notifications" } 
    }));
  };

  // ✅ Обработка клика по событию
  const handleEventClick = (type: "store_request" | "new_order", rawId: string) => {
    setIsOpen(false);
    const tab = type === "store_request" ? "shops" : "orders";
    // Навигация через CustomEvent
    window.dispatchEvent(new CustomEvent("admin-navigate", { 
      detail: { tab, itemId: rawId } 
    }));
  };

  return (
    <div className="relative">
      {/* 🔴 Индикатор: Megaphone с бейджем */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-all duration-200 ${
          badgeCount > 0
            ? "bg-white/10 text-white ring-1 ring-[#D90429]/50"
            : "bg-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        }`}
        title={badgeCount > 0 ? `${badgeCount} gözləyən hadisə` : "Gözləyən yoxdur"}
        type="button"
      >
        <Megaphone className="w-5 h-5" />
        {badgeCount > 0 && (
          <span
            className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#D90429] ring-2 ring-white/90 shadow-sm"
            aria-hidden
          />
        )}
      </button>

      {/* ✅ Выпадающий список */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[99999]">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-[#1F2937] text-sm">Gözləyən hadisələr</h3>
            <button onClick={() => setIsOpen(false)} className="text-xs text-gray-400 hover:text-[#D90429]">Bağla</button>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {events.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-20" />
                Gözləyən müraciət yoxdur
              </div>
            ) : (
              events.map((ev) => (
                <div 
                  key={ev.id} 
                  onClick={() => handleEventClick(ev.type, ev.requestId || ev.orderId)}
                  className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 flex items-center justify-between group cursor-pointer`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      ev.type === "store_request" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                    }`}>
                      {ev.type === "store_request" ? <Store className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1F2937]">{ev.title}</p>
                      <p className="text-xs text-[#6B7280]">{ev.subtitle}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#D90429] transition-colors" />
                </div>
              ))
            )}
          </div>

          {/* ✅ Кнопка перехода к уведомлениям */}
          <div className="p-3 bg-gray-50 border-t border-gray-100">
            <button
              onClick={navigateToNotifications}
              className="w-full px-3 py-2.5 text-xs font-semibold text-[#1F2937] bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Bell className="w-3.5 h-3.5 text-[#D90429]" /> 
              Yeni bildiriş
            </button>
          </div>
        </div>
      )}
    </div>
  );
}