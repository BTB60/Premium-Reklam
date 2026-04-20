// src/lib/db/messages.ts
// Модуль работы с сообщениями поддержки (100% Mock DB + Hybrid Ready)
// Ключ: decor_support_messages

import { SupportMessage, SupportNotification } from "./types";
import { getFromStorage, saveToStorage, dispatchStorageEvent } from "./storage";

const MESSAGES_KEY = "decor_support_messages";
const NOTIFICATIONS_KEY = "decor_support_notifications";
const ADMIN_ID = "admin-1";

// ===== Отправка сообщения =====
export async function send(
  senderId: string,
  senderRole: "DECORATOR" | "ADMIN" | "SUBADMIN",
  receiverId: string,
  content: string,
  attachment?: SupportMessage["attachment"]
): Promise<SupportMessage> {
  console.log(`[messages.send] Called: ${senderId} → ${receiverId}, content: "${content?.slice(0, 30)}..."`);
  
  const messages = getFromStorage<SupportMessage[]>(MESSAGES_KEY, []);
  console.log(`[messages.send] Current messages count: ${messages.length}`);
  
  const newMessage: SupportMessage = {
    id: Date.now().toString(),
    conversationId: receiverId === ADMIN_ID ? senderId : receiverId,
    senderId,
    senderRole,
    content: content.trim(),
    attachment,
    createdAt: new Date().toISOString(),
    read: false,
  };

  messages.push(newMessage);
  console.log(`[messages.send] Saving ${messages.length} messages to ${MESSAGES_KEY}`);
  
  saveToStorage(MESSAGES_KEY, messages);
  console.log(`[messages.send] Dispatched storage event for ${MESSAGES_KEY}`);

  // Создаём уведомление для получателя
  if (senderRole !== "ADMIN") {
    createNotificationForAdmin(newMessage);
  } else {
    createNotificationForUser(receiverId, newMessage);
  }

  return newMessage;
}

// ===== Получение диалога =====
export function getConversation(userId: string, adminId: string = ADMIN_ID): SupportMessage[] {
  const messages = getFromStorage<SupportMessage[]>(MESSAGES_KEY, []);
  return messages
    .filter(m => m.conversationId === userId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

// ===== Счётчик непрочитанных =====
export function getUnreadCount(userId: string, userRole: "DECORATOR" | "ADMIN"): number {
  const messages = getFromStorage<SupportMessage[]>(MESSAGES_KEY, []);
  return messages.filter(m => {
    if (m.read) return false;
    if (userRole === "ADMIN") {
      return m.senderRole !== "ADMIN" && m.conversationId === userId;
    } else {
      return m.senderRole === "ADMIN" && m.conversationId === userId;
    }
  }).length;
}

// ===== Пометить как прочитанное =====
export function markAsRead(userId: string, messageId: string): boolean {
  const messages = getFromStorage<SupportMessage[]>(MESSAGES_KEY, []);
  const msg = messages.find(m => m.id === messageId && m.conversationId === userId);
  if (!msg || msg.read) return false;
  
  msg.read = true;
  saveToStorage(MESSAGES_KEY, messages);
  return true;
}

export function markAllAsRead(userId: string): number {
  const messages = getFromStorage<SupportMessage[]>(MESSAGES_KEY, []);
  let updated = 0;
  
  messages.forEach(m => {
    if (!m.read && m.conversationId === userId) {
      m.read = true;
      updated++;
    }
  });
  
  if (updated > 0) {
    saveToStorage(MESSAGES_KEY, messages);
  }
  return updated;
}

// ===== Уведомления поддержки =====
function createNotificationForAdmin(message: SupportMessage): void {
  const notifications = getFromStorage<SupportNotification[]>(NOTIFICATIONS_KEY, []);
  notifications.push({
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId: ADMIN_ID,
    type: "support_message",
    messageId: message.id,
    preview: message.content.length > 50 ? message.content.slice(0, 50) + "..." : message.content,
    createdAt: new Date().toISOString(),
    read: false,
  });
  saveToStorage(NOTIFICATIONS_KEY, notifications);
}

function createNotificationForUser(userId: string, message: SupportMessage): void {
  const notifications = getFromStorage<SupportNotification[]>(NOTIFICATIONS_KEY, []);
  notifications.push({
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    type: "support_message",
    messageId: message.id,
    preview: message.attachment ? `📎 ${message.attachment.type}` : message.content.slice(0, 50),
    createdAt: new Date().toISOString(),
    read: false,
  });
  saveToStorage(NOTIFICATIONS_KEY, notifications);
}

export function getUnreadSupportNotifications(userId: string): SupportNotification[] {
  const notifications = getFromStorage<SupportNotification[]>(NOTIFICATIONS_KEY, []);
  return notifications.filter(
    (n) => String(n.userId) === String(userId) && !n.read
  );
}

export function markNotificationAsRead(notificationId: string): boolean {
  const notifications = getFromStorage<SupportNotification[]>(NOTIFICATIONS_KEY, []);
  const notif = notifications.find(n => n.id === notificationId);
  if (!notif || notif.read) return false;
  notif.read = true;
  saveToStorage(NOTIFICATIONS_KEY, notifications);
  return true;
}

// ===== Валидация файлов =====
export const MAX_FILE_SIZE = 4 * 1024 * 1024;

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) return { valid: false, error: "Fayl ölçüsü 4MB-dan çox olmamalıdır" };
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    return { valid: false, error: "Yalnız şəkil və ya video fayllar qəbul edilir" };
  }
  return { valid: true };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ===== Экспорт для гибридного API =====
export const messagesApi = {
  send,
  getConversation,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getUnreadSupportNotifications,
  markNotificationAsRead,
};

console.log("[messages.ts] Module loaded, exports:", Object.keys({ send, getConversation, getUnreadCount, markAsRead, markAllAsRead, getUnreadSupportNotifications, markNotificationAsRead, messagesApi }));