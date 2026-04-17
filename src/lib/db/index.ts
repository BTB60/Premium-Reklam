// src/lib/db/index.ts
// Точка входа: ре-экспорт всех модулей Mock DB

// Types
export * from "./types";

// Utils
export * from "./utils";

// Core modules
export { auth } from "./auth";
export { orders, notifications } from "./orders";
export { products, templates } from "./products";
export { 
  vendorStores, storeRequests, vendorProducts, vendorOrders, 
  reviews, vendorWithdrawals, calculateCommission 
} from "./vendor";
export { bonus, payments, messages, favorites, referrals, promoCodes } from "./user-features";
export { settings, tasks, inventory, finance, calendar } from "./business";

// ✅ НОВОЕ: задачи исполнителей
export { workerTasks } from "./worker-tasks";

// Storage helpers (internal, but exported if needed)
export { getFromStorage, saveToStorage, removeFromStorage } from "./storage";

// ✅ Утилита для звуковых уведомлений (если используется)
export function playNotificationSound(): void {
  if (typeof window !== "undefined") {
    try {
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}
  }
}