// src/lib/authApi/orders.ts

import { Order, OrderWorkflowStatus } from "@/lib/db/types";
import { orders, notifications } from "@/lib/db/orders";
import { auth } from "@/lib/db/auth";
import { getFromStorage, saveToStorage } from "@/lib/db/storage";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const getAuthHeaders = (): Record<string, string> => {
  const user = auth.getCurrentUser();
  return {
    "Content-Type": "application/json",
    ...(user ? { Authorization: `Bearer ${user.token || "mock-token"}` } : {}),
  };
};

export const orderApi = {
  /**
   * Получение заказов текущего пользователя
   */
  async getMyOrders(): Promise<{ orders: Order[] }> {
    try {
      const res = await fetch(`${BASE_URL}/api/orders/my`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Backend unavailable");
      const data = await res.json();
      return { orders: Array.isArray(data.orders) ? data.orders : data };
    } catch {
      const currentUser = auth.getCurrentUser();
      if (!currentUser) return { orders: [] };
      return { orders: orders.getByUserId(currentUser.id) };
    }
  },

  /**
   * Получение всех заказов (для Админа)
   */
  async getOrdersFromBackend(): Promise<{ orders: Order[] }> {
    try {
      const res = await fetch(`${BASE_URL}/api/orders`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Backend unavailable");
      const data = await res.json();
      return { orders: Array.isArray(data.orders) ? data.orders : data };
    } catch {
      return { orders: orders.getAll() };
    }
  },

  /**
   * Создание заказа (гибрид: Бэкенд → Mock DB)
   */
  async create(orderPayload: Partial<Order> & { items: any[] }): Promise<Order> {
    try {
      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(orderPayload),
      });
      if (!res.ok) throw new Error("Backend unavailable");
      return await res.json();
    } catch {
      // Fallback на Mock DB
      // Гарантируем инициализацию новых полей, если они не переданы явно
      const completePayload: any = {
        ...orderPayload,
        workflowStatus: "təsdiq",
        bonusUsed: orderPayload.bonusUsed || 0,
        paymentBreakdown: orderPayload.paymentBreakdown || {
          cash: orderPayload.finalTotal || 0,
          bonus: orderPayload.bonusUsed || 0,
          total: orderPayload.finalTotal || 0,
        },
        status: "pending",
        paymentStatus: (orderPayload.bonusUsed || 0) >= (orderPayload.finalTotal || 0) ? "paid" : "pending",
      };
      return orders.create(completePayload);
    }
  },

  /**
   * Обновление стадии заказа (workflowStatus)
   */
  async updateWorkflowStatus(orderId: string | number, status: string): Promise<Order | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ workflowStatus: status }),
      });
      if (!res.ok) throw new Error("Backend unavailable");
      return await res.json();
    } catch {
      // Fallback на Mock DB с логикой бонусов и уведомлений
      const normalizedStatus = status.toLowerCase() as OrderWorkflowStatus;
      return orders.updateWorkflowStatus(String(orderId), normalizedStatus);
    }
  },

  /**
   * Удаление заказа
   */
  async delete(orderId: string | number): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      return res.ok;
    } catch {
      return orders.delete(String(orderId));
    }
  },

  /**
   * Частичная/Полная оплата заказа
   */
  async addPayment(orderId: string | number, amount: number, method: string, description: string): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${orderId}/payment`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount, method, description }),
      });
      if (!res.ok) throw new Error("Backend unavailable");
      return await res.json();
    } catch {
      // Fallback на Mock DB
      const allOrders = getFromStorage<Order[]>("decor_orders", []);
      const index = allOrders.findIndex(o => String(o.id) === String(orderId));
      if (index === -1) throw new Error("Заказ не найден");

      const order = allOrders[index];
      const currentPaid = order.paidAmount || 0;
      const newPaid = Math.min(currentPaid + amount, order.finalTotal);
      const remaining = Math.max(0, order.finalTotal - newPaid);
      
      // Определяем статус оплаты
      const newPaymentStatus = remaining === 0 ? "paid" : newPaid > 0 ? "partial" : "pending";

      // Обновляем заказ
      allOrders[index] = {
        ...order,
        paidAmount: newPaid,
        remainingAmount: remaining,
        paymentStatus: newPaymentStatus,
        updatedAt: new Date().toISOString(),
      };
      
      saveToStorage("decor_orders", allOrders);

      // Уведомление пользователя
      notifications.create({
        userId: order.userId,
        title: "Ödəniş qəbul edildi",
        message: `Sifariş #${order.orderNumber || order.id.slice(-4)} üzrə ${amount.toFixed(2)} AZN ödəniş təsdiqləndi.`,
        type: "payment",
      });

      // Если полностью оплачено и статус ещё не "ödəniş", переводим в него для начисления бонусов
      if (newPaymentStatus === "paid" && order.workflowStatus === "təsdiq") {
        orders.updateWorkflowStatus(String(orderId), "ödəniş");
      }

      return { success: true, paidAmount: newPaid, remainingAmount: remaining };
    }
  },
};