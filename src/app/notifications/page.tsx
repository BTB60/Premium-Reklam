"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { 
  ArrowLeft, 
  Bell, 
  Package, 
  CreditCard, 
  Info,
  CheckCircle,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, notifications as notificationsStore, type User, type Notification } from "@/lib/db";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    
    // Load notifications
    const userNotifications = notificationsStore.getByUserId(currentUser.id)
      .sort((a: Notification, b: Notification) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setNotifications(userNotifications);
    setLoading(false);
  }, [router]);

  const markAsRead = (id: string) => {
    notificationsStore.markAsRead(id);
    setNotifications(notifications.map((n: Notification) => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const markAllAsRead = () => {
    notifications.forEach((n: Notification) => {
      if (!n.isRead) {
        notificationsStore.markAsRead(n.id);
      }
    });
    setNotifications(notifications.map((n: Notification) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    notificationsStore.delete(id);
    setNotifications(notifications.filter((n: Notification) => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "order_status":
        return <Package className="w-5 h-5 text-[#D90429]" />;
      case "payment":
        return <CreditCard className="w-5 h-5 text-emerald-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D90429]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Header />
      
      <main className="pt-20 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" icon={<ArrowLeft className="w-5 h-5" />}>
                  Geri
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-[#1F2937]">Bildirişlər</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-[#6B7280]">{unreadCount} oxunmamış</p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Hamısını oxu
              </Button>
            )}
          </motion.div>

          {/* Notifications List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {notifications.length === 0 ? (
              <EmptyState
                type="notifications"
                actionLabel="Sifariş yarat"
                onAction={() => router.push("/orders/new")}
              />
            ) : (
              <div className="space-y-3">
                {notifications.map((notification, index) => (
                  <Card
                    key={`${notification.id}-${index}`}
                    className={cn(
                      "p-4 transition-colors",
                      !notification.isRead && "bg-blue-50/50 border-blue-200"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-[#1F2937]">
                              {notification.title}
                            </p>
                            <p className="text-sm text-[#6B7280] mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-[#9CA3AF] mt-2">
                              {new Date(notification.createdAt).toLocaleString("az-AZ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Oxundu kimi işarələ"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
