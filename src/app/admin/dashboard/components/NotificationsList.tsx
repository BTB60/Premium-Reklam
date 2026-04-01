"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Bell, Trash2, Check, Mail, AlertCircle, Info, X } from "lucide-react";

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "system" | "order_status" | "payment" | "support";
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    try {
      // Загружаем из localStorage (бэкенд уведомлений пока нет)
      const stored = localStorage.getItem("decor_notifications");
      if (stored) {
        const list = JSON.parse(stored);
        setNotifications(list);
      }
    } catch (error) {
      console.error("[Notifications] Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = (id: string) => {
    if (!confirm("Bildirişi silmək istədiyinizə əminsiniz?")) return;
    try {
      const stored = localStorage.getItem("decor_notifications");
      const list = stored ? JSON.parse(stored) : [];
      const updated = list.filter((n: Notification) => n.id !== id);
      localStorage.setItem("decor_notifications", JSON.stringify(updated));
      setNotifications(updated);
    } catch (error) {
      console.error("[Notifications] Delete error:", error);
    }
  };

  const markAsRead = (id: string) => {
    try {
      const stored = localStorage.getItem("decor_notifications");
      const list = stored ? JSON.parse(stored) : [];
      const updated = list.map((n: Notification) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      localStorage.setItem("decor_notifications", JSON.stringify(updated));
      setNotifications(updated);
    } catch (error) {
      console.error("[Notifications] Mark read error:", error);
    }
  };

  const markAllAsRead = () => {
    try {
      const stored = localStorage.getItem("decor_notifications");
      const list = stored ? JSON.parse(stored) : [];
      const updated = list.map((n: Notification) => ({ ...n, isRead: true }));
      localStorage.setItem("decor_notifications", JSON.stringify(updated));
      setNotifications(updated);
    } catch (error) {
      console.error("[Notifications] Mark all read error:", error);
    }
  };

  const deleteAllRead = () => {
    if (!confirm("Oxunmuş bildirişləri silmək istədiyinizə əminsiniz?")) return;
    try {
      const stored = localStorage.getItem("decor_notifications");
      const list = stored ? JSON.parse(stored) : [];
      const updated = list.filter((n: Notification) => !n.isRead);
      localStorage.setItem("decor_notifications", JSON.stringify(updated));
      setNotifications(updated);
    } catch (error) {
      console.error("[Notifications] Delete all read error:", error);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread" && n.isRead) return false;
    if (filter === "read" && !n.isRead) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const stats = {
    total: notifications.length,
    unread: unreadCount,
    read: notifications.length - unreadCount,
    system: notifications.filter(n => n.type === "system").length,
    order: notifications.filter(n => n.type === "order_status").length,
    payment: notifications.filter(n => n.type === "payment").length,
    support: notifications.filter(n => n.type === "support").length,
  };

  const getTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "system": return <Info className="w-5 h-5 text-blue-500" />;
      case "order_status": return <Bell className="w-5 h-5 text-amber-500" />;
      case "payment": return <Mail className="w-5 h-5 text-green-500" />;
      case "support": return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: Notification["type"]) => {
    switch (type) {
      case "system": return "Sistem";
      case "order_status": return "Sifariş";
      case "payment": return "Ödəniş";
      case "support": return "Dəstək";
      default: return type;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-[#D90429]" />
          <h1 className="text-2xl font-bold text-[#1F2937]">Bildirişlər</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            icon={<Check className="w-4 h-4" />}
          >
            Hamısını oxunmuş et
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={deleteAllRead}
            icon={<Trash2 className="w-4 h-4" />}
          >
            Oxunmuşları sil
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-[#6B7280] text-sm">Ümumi</p>
          <p className="text-2xl font-bold text-[#1F2937]">{stats.total}</p>
        </Card>
        <Card className="p-4 bg-blue-50">
          <p className="text-blue-600 text-sm">Oxunmamış</p>
          <p className="text-2xl font-bold text-blue-700">{stats.unread}</p>
        </Card>
        <Card className="p-4 bg-green-50">
          <p className="text-green-600 text-sm">Oxunmuş</p>
          <p className="text-2xl font-bold text-green-700">{stats.read}</p>
        </Card>
        <Card className="p-4 bg-amber-50">
          <p className="text-amber-600 text-sm">Sifariş</p>
          <p className="text-2xl font-bold text-amber-700">{stats.order}</p>
        </Card>
      </div>

      {/* Фильтры */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#6B7280]">Status:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as "all" | "unread" | "read")}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D90429]"
            >
              <option value="all">Hamısı</option>
              <option value="unread">Oxunmamış</option>
              <option value="read">Oxunmuş</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#6B7280]">Növ:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D90429]"
            >
              <option value="all">Hamısı</option>
              <option value="system">Sistem</option>
              <option value="order_status">Sifariş</option>
              <option value="payment">Ödəniş</option>
              <option value="support">Dəstək</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Список уведомлений */}
      {loading ? (
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D90429] mx-auto" />
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-[#6B7280]">Bildiriş yoxdur</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 transition-all ${
                !notification.isRead ? "bg-blue-50 border-l-4 border-l-[#D90429]" : "bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">{getTypeIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-semibold ${!notification.isRead ? "text-[#1F2937]" : "text-[#6B7280]"}`}>
                        {notification.title}
                      </p>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-[#6B7280]">
                        {getTypeLabel(notification.type)}
                      </span>
                      {!notification.isRead && (
                        <span className="text-xs px-2 py-0.5 bg-[#D90429] text-white rounded">
                          Yeni
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#6B7280] mb-2">{notification.message}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      {new Date(notification.createdAt).toLocaleString("az-AZ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 text-green-500 hover:bg-green-50 rounded"
                      title="Oxunmuş et"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}