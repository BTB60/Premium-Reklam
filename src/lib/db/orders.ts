// src/lib/db/orders.ts

import { Order, OrderWorkflowStatus, VendorStore, Notification } from "./types";
import { getFromStorage, saveToStorage } from "./storage";
import { auth } from "./auth";

const ORDERS_KEY = "decor_orders";
const NOTIFICATIONS_KEY = "decor_notifications";
const VENDOR_STORES_KEY = "decor_vendor_stores";

const WORKFLOW_MAP: Record<string, OrderWorkflowStatus> = {
  pending: "təsdiq",
  approved: "ödəniş",
  confirmed: "ödəniş",
  design: "dizayn",
  printing: "dizayn",
  production: "istehsal",
  ready: "kuryer",
  delivering: "kuryer",
  completed: "bitdi",
  cancelled: "cancelled",
};

const PRODUCTION_STATUSES: OrderWorkflowStatus[] = ["dizayn", "istehsal", "kuryer", "bitdi"];

function getOrders(): Order[] {
  return getFromStorage<Order[]>(ORDERS_KEY, []);
}

function saveOrders(orders: Order[]) {
  saveToStorage(ORDERS_KEY, orders);
}

function getNotifications(): Notification[] {
  return getFromStorage<Notification[]>(NOTIFICATIONS_KEY, []);
}

function saveNotifications(notifications: Notification[]) {
  saveToStorage(NOTIFICATIONS_KEY, notifications);
}

function updateVendorStoreStats(vendorId: string, orderAmount: number, bonusEarned: number) {
  const user = auth.getById(vendorId);
  if (!user?.storeId) {
    console.log(`[updateVendorStoreStats] User ${vendorId} has no storeId`);
    return;
  }
  
  const allStores = getFromStorage<VendorStore[]>(VENDOR_STORES_KEY, []);
  const index = allStores.findIndex(s => s.id === user.storeId);
  if (index === -1) {
    console.log(`[updateVendorStoreStats] Store ${user.storeId} not found`);
    return;
  }
  
  const store = allStores[index];
  const newTotalOrderAmount = Math.round(((store.totalOrderAmount || 0) + orderAmount) * 100) / 100;
  const newTotalBonusEarned = Math.round(((store.totalBonusEarned || 0) + bonusEarned) * 100) / 100;
  
  allStores[index] = {
    ...store,
    totalOrderAmount: newTotalOrderAmount,
    totalBonusEarned: newTotalBonusEarned,
    updatedAt: new Date().toISOString(),
  };
  
  saveToStorage(VENDOR_STORES_KEY, allStores);
}

export const orders = {
  getAll(): Order[] {
    return getOrders();
  },

  getByUserId(userId: string): Order[] {
    return getOrders().filter((o) => String(o.userId) === String(userId));
  },

  getById(id: string): Order | undefined {
    return getOrders().find((o) => String(o.id) === String(id));
  },

  create(orderData: Omit<Order, "id" | "createdAt" | "workflowStatus" | "bonusUsed" | "paymentBreakdown">): Order {
    // ✅ ЖЁСТКАЯ ВАЛИДАЦИЯ: userId обязан быть
    if (!orderData.userId || orderData.userId.trim() === "") {
      console.error("[orders.create] CRITICAL: userId is missing in order payload!");
      throw new Error("Невозможно создать заказ без userId");
    }
    if (!String(orderData.customerName || "").trim()) {
      throw new Error("Dekor adı məcburidir");
    }

    const newOrder: Order = {
      ...orderData,
      customerName: String(orderData.customerName).trim(),
      id: Date.now().toString(),
      workflowStatus: "təsdiq",
      bonusUsed: orderData.bonusUsed || 0, // ✅ Сохраняем переданное значение
      paymentStatus: orderData.paymentStatus || "pending",
      paidAmount: orderData.paidAmount || 0,
      remainingAmount: orderData.remainingAmount ?? (orderData.finalTotal ?? 0),
      paymentBreakdown: orderData.paymentBreakdown || {
        cash: orderData.finalTotal ?? 0,
        bonus: orderData.bonusUsed || 0,
        total: orderData.finalTotal ?? 0,
      },
      createdAt: new Date().toISOString(),
    };

    // ✅ СПИСАНИЕ БОНУСОВ: если заказ создан с использованием бонусов
    if (newOrder.bonusUsed > 0) {
      console.log(`[orders.create] Spending ${newOrder.bonusUsed} bonus points for order ${newOrder.id}`);
      const updatedUser = auth.spendBonusPoints(String(newOrder.userId), newOrder.bonusUsed);
      if (!updatedUser) {
        console.warn(`[orders.create] Failed to spend bonus points for user ${newOrder.userId}`);
      }
    }

    const all = getOrders();
    all.push(newOrder);
    saveOrders(all);

    try {
      const user = auth.getById(orderData.userId);
      if (user) {
        const userOrders = this.getByUserId(orderData.userId);
        auth.update(orderData.userId, { totalOrders: userOrders.length });
      }
    } catch (e) {
      console.warn("[orders.create] Auth update skipped:", e);
    }

    return newOrder;
  },

  updateStatus(id: string, newStatus: string): Order | null {
    const all = getOrders();
    const index = all.findIndex((o) => String(o.id) === String(id));
    if (index === -1) return null;

    all[index] = {
      ...all[index],
      status: newStatus,
      workflowStatus: WORKFLOW_MAP[newStatus] || all[index].workflowStatus,
      updatedAt: new Date().toISOString(),
    };
    saveOrders(all);
    return all[index];
  },

  updateWorkflowStatus(id: string, newStatus: OrderWorkflowStatus): Order | null {
    const all = getOrders();
    const index = all.findIndex((o) => String(o.id) === String(id));
    if (index === -1) {
      console.error(`[orders.updateWorkflowStatus] Order ${id} not found`);
      return null;
    }

    const order = all[index];
    const oldStatus = order.workflowStatus;

    // ✅ КРИТИЧЕСКАЯ ПРОВЕРКА: если userId отсутствует — прерываем
    if (!order.userId) {
      console.error(`[orders.updateWorkflowStatus] FATAL: order ${id} has no userId!`);
      console.error("Order data:", JSON.stringify(order, null, 2));
      return null;
    }

    const entersProduction = PRODUCTION_STATUSES.includes(newStatus);
    const isPaymentPending = order.paymentStatus !== "paid";
    const hasTotal = !!(order.finalTotal && order.finalTotal > 0);
    
    if (entersProduction && isPaymentPending && hasTotal) {
      // Фиксация оплаты
      order.paymentStatus = "paid";
      order.paidAmount = order.finalTotal;
      order.remainingAmount = 0;
      
      // Расчёт базы для бонуса (начисляем 5% от суммы ЗА ВЫЧЕТОМ уже использованных бонусов)
      const baseForBonus = Math.max(0, (order.finalTotal || 0) - (order.bonusUsed || 0));
      
      if (baseForBonus > 0) {
        const updatedUser = auth.addBonusPoints(String(order.userId), baseForBonus);
        if (updatedUser) {
          updateVendorStoreStats(String(order.userId), order.finalTotal || 0, Math.round(baseForBonus * 0.05 * 100) / 100);
        }
      }
    }

    // Отмена заказа — возврат бонусов
    if (newStatus === "cancelled" && (PRODUCTION_STATUSES.includes(oldStatus) || oldStatus === "ödəniş") && order.bonusUsed > 0) {
      auth.addBonusPoints(String(order.userId), order.bonusUsed);
      order.bonusUsed = 0;
      order.paymentBreakdown = {
        cash: order.finalTotal,
        bonus: 0,
        total: order.finalTotal,
      };
    }

    // Сохранение заказа
    all[index] = {
      ...order,
      status: Object.keys(WORKFLOW_MAP).find((k) => WORKFLOW_MAP[k] === newStatus) || order.status,
      workflowStatus: newStatus,
      updatedAt: new Date().toISOString(),
    };
    saveOrders(all);

    // Уведомление пользователя
    const statusLabels: Record<OrderWorkflowStatus, string> = {
      "təsdiq": "Təsdiq edildi",
      "ödəniş": "Ödəniş təsdiqləndi, istehsalata götürüldü",
      "dizayn": "Dizayn prosesi başladı",
      "istehsal": "İstehsal prosesindədir",
      "kuryer": "Kuryer yola düşüb",
      "bitdi": "Sifariş uğurla tamamlandı! 🎉",
      "cancelled": "Sifariş ləğv edildi"
    };

    notifications.create({
      userId: String(order.userId),
      title: `Sifariş #${order.orderNumber || order.id.slice(-4)}`,
      message: statusLabels[newStatus] || `Status dəyişdirildi: ${newStatus}`,
      type: "order_status",
    });

    return all[index];
  },

  calculateBonus(amount: number): number {
    return Math.round(amount * 0.05 * 100) / 100;
  },

  applyBonusToOrder(orderId: string, bonusAmount: number): Order | null {
    const all = getOrders();
    const index = all.findIndex((o) => String(o.id) === String(orderId));
    if (index === -1) return null;

    const order = all[index];
    if (bonusAmount <= 0 || order.finalTotal <= 0) return null;
    if (bonusAmount > order.finalTotal) bonusAmount = order.finalTotal;

    const user = auth.getById(String(order.userId));
    if (!user || user.bonusPoints < 10) return null;

    const updatedUser = auth.spendBonusPoints(String(order.userId), bonusAmount);
    if (!updatedUser) return null;

    const newBonusUsed = Math.round((order.bonusUsed + bonusAmount) * 100) / 100;
    const remainingCash = Math.round((order.finalTotal - newBonusUsed) * 100) / 100;

    all[index] = {
      ...order,
      bonusUsed: newBonusUsed,
      paidAmount: Math.round(((order.paidAmount || 0) + bonusAmount) * 100) / 100,
      remainingAmount: Math.max(0, remainingCash - (order.paidAmount || 0)),
      paymentBreakdown: {
        cash: remainingCash,
        bonus: newBonusUsed,
        total: order.finalTotal,
      },
      updatedAt: new Date().toISOString(),
    };

    saveOrders(all);
    return all[index];
  },

  delete(id: string): boolean {
    const all = getOrders();
    const orderToDelete = all.find((o) => String(o.id) === String(id));
    
    if (orderToDelete && PRODUCTION_STATUSES.includes(orderToDelete.workflowStatus)) {
      console.warn(`[orders.delete] Заказ ${id} в производственной стадии.`);
    }

    const filtered = all.filter((o) => String(o.id) !== String(id));
    if (filtered.length === all.length) return false;
    
    saveOrders(filtered);
    
    if (orderToDelete) {
      const userOrders = this.getByUserId(orderToDelete.userId);
      auth.update(orderToDelete.userId, { totalOrders: userOrders.length });
    }
    return true;
  },
};

export const notifications = {
  getAll(): Notification[] {
    return getNotifications();
  },
  getByUserId(userId: string): Notification[] {
    const key = String(userId);
    return getNotifications().filter((n) => String(n.userId) === key);
  },
  create(notification: Omit<Notification, "id" | "createdAt" | "isRead">): Notification {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    const all = getNotifications();
    all.push(newNotification);
    saveNotifications(all);
    return newNotification;
  },
  markAsRead(id: string): void {
    const all = getNotifications();
    const index = all.findIndex((n) => n.id === id);
    if (index !== -1) {
      all[index].isRead = true;
      saveNotifications(all);
    }
  },
  delete(id: string): void {
    const all = getNotifications().filter((n) => n.id !== id);
    saveNotifications(all);
  },
};