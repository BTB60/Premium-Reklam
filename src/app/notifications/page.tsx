"use client";

import { useEffect, useState, useCallback } from "react";
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
  Trash2,
  Megaphone,
  Headphones,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, notifications as notificationsStore, type Notification } from "@/lib/db";
import { announcementApi, type Announcement } from "@/lib/authApi";
import {
  getUnreadSupportNotifications,
  markNotificationAsRead,
} from "@/lib/db/messages";
import type { SupportNotification } from "@/lib/db/types";
import { cn } from "@/lib/utils";
import {
  fetchMyInAppNotifications,
  markAllInAppNotificationsRead,
  type InAppNotificationRow,
} from "@/lib/clientPaymentNotificationsApi";

function getSessionUserId(): string | null {
  const u = auth.getCurrentUser();
  if (u?.id != null) return String(u.id);
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("decor_current_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: string | number; userId?: string | number };
    if (parsed.userId != null) return String(parsed.userId);
    if (parsed.id != null) return String(parsed.id);
  } catch {
    /* ignore */
  }
  return null;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [supportUnread, setSupportUnread] = useState<SupportNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverNotificationIds, setServerNotificationIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const uid = getSessionUserId();
    try {
      const [activeList, personal, serverRows] = await Promise.all([
        announcementApi.getActive(),
        Promise.resolve(uid ? notificationsStore.getByUserId(uid) : []),
        fetchMyInAppNotifications().catch(() => [] as InAppNotificationRow[]),
      ]);
      const mappedServer: Notification[] = serverRows.map((r) => ({
        id: `srv-${r.id}`,
        userId: uid || "0",
        type: String(r.type || "system").toLowerCase(),
        title: String(r.type || "SYSTEM"),
        message: r.message,
        isRead: Boolean(r.isRead),
        createdAt: r.createdAt,
      }));
      const sorted = [...mappedServer, ...personal].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAnnouncements(Array.isArray(activeList) ? activeList : []);
      setNotifications(sorted);
      setServerNotificationIds(new Set(mappedServer.map((n) => n.id)));
      if (uid) {
        setSupportUnread(getUnreadSupportNotifications(uid));
      } else {
        setSupportUnread([]);
      }
    } catch (e) {
      console.error("[notifications page]", e);
      setAnnouncements([]);
      setNotifications([]);
      setSupportUnread([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromAuth = auth.getCurrentUser();
    let fromStorage: unknown = null;
    try {
      const raw = localStorage.getItem("decor_current_user");
      if (raw) fromStorage = JSON.parse(raw);
    } catch {
      /* ignore */
    }
    if (!fromAuth && !fromStorage) {
      router.push("/login");
      return;
    }
    void load();
  }, [router, load]);

  const markAsRead = (id: string) => {
    if (!id.startsWith("srv-")) {
      notificationsStore.markAsRead(id);
    }
    window.dispatchEvent(new CustomEvent("premium:inapp-mark-read", { detail: { ids: [id] } }));
    // Oxunan bildirişi siyahıdan çıxarırıq ki yenidən görünməsin.
    setNotifications((prev) => prev.filter((n: Notification) => n.id !== id));
  };

  const markAllAsRead = async () => {
    const idsToDismiss = notifications.filter((n: Notification) => !n.isRead).map((n) => n.id);
    notifications.forEach((n: Notification) => {
      if (!n.isRead && !n.id.startsWith("srv-")) notificationsStore.markAsRead(n.id);
    });
    if (notifications.some((n) => !n.isRead && serverNotificationIds.has(n.id))) {
      try {
        await markAllInAppNotificationsRead();
      } catch {
        // local fallback onsuz da tətbiq edilir
      }
    }
    if (idsToDismiss.length > 0) {
      window.dispatchEvent(new CustomEvent("premium:inapp-mark-read", { detail: { ids: idsToDismiss } }));
    }
    setNotifications([]);
  };

  const deleteNotification = (id: string) => {
    if (!id.startsWith("srv-")) {
      notificationsStore.delete(id);
    }
    setNotifications((prev) => prev.filter((n: Notification) => n.id !== id));
  };

  const handleSupportRead = (n: SupportNotification) => {
    markNotificationAsRead(n.id);
    setSupportUnread((prev) => prev.filter((x) => x.id !== n.id));
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

  const unreadPersonal = notifications.filter((n) => !n.isRead).length;

  const hasAnyContent =
    announcements.length > 0 ||
    notifications.length > 0 ||
    supportUnread.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D90429]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Header />

      <main className="pt-20 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                {(unreadPersonal > 0 || supportUnread.length > 0) && (
                  <p className="text-sm text-[#6B7280]">
                    {unreadPersonal + supportUnread.length} oxunmamış
                  </p>
                )}
              </div>
            </div>
            {unreadPersonal > 0 && (
              <Button variant="ghost" size="sm" onClick={() => void markAllAsRead()}>
                Şəxsi bildirişləri oxu
              </Button>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-8"
          >
            {!hasAnyContent ? (
              <>
                <EmptyState type="notifications" />
                <p className="text-center text-sm text-[#6B7280] mt-4">
                  <Link href="/dashboard" className="text-[#D90429] font-medium hover:underline">
                    Dashboard-a qayıt
                  </Link>
                </p>
              </>
            ) : (
              <>
                {supportUnread.length > 0 && (
                  <section>
                    <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Headphones className="w-4 h-4" /> Dəstək mesajları
                    </h2>
                    <div className="space-y-3">
                      {supportUnread.map((sn) => (
                        <Card
                          key={sn.id}
                          className="p-4 border-l-4 border-l-emerald-500 bg-emerald-50/40"
                        >
                          <div className="flex justify-between gap-3">
                            <div>
                              <p className="font-medium text-[#1F2937]">Yeni dəstək cavabı</p>
                              <p className="text-sm text-[#6B7280] mt-1 line-clamp-2">{sn.preview}</p>
                              <p className="text-xs text-[#9CA3AF] mt-2">
                                {new Date(sn.createdAt).toLocaleString("az-AZ")}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              <Link href="/dashboard/support">
                                <Button size="sm" variant="secondary">
                                  Aç
                                </Button>
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleSupportRead(sn)}
                                className="text-xs text-emerald-700 hover:underline"
                              >
                                Oxundu
                              </button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}

                {announcements.length > 0 && (
                  <section>
                    <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Megaphone className="w-4 h-4" /> Elanlar
                    </h2>
                    <div className="space-y-3">
                      {announcements.map((a) => (
                        <Card key={String(a.id)} className="p-4 border border-[#E5E7EB]">
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white",
                                String(a.priority).toUpperCase() === "URGENT"
                                  ? "bg-red-500"
                                  : String(a.priority).toUpperCase() === "IMPORTANT"
                                    ? "bg-amber-500"
                                    : "bg-[#D90429]"
                              )}
                            >
                              <Megaphone className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-[#1F2937]">{a.title}</p>
                              <p className="text-sm text-[#6B7280] mt-1 whitespace-pre-wrap">{a.message}</p>
                              <p className="text-xs text-[#9CA3AF] mt-2">
                                {new Date(a.createdAt).toLocaleString("az-AZ")}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}

                {notifications.length > 0 && (
                  <section>
                    <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Bell className="w-4 h-4" /> Şəxsi bildirişlər
                    </h2>
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
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-[#E5E7EB]">
                              {getIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-semibold text-[#1F2937]">{notification.title}</p>
                                  <p className="text-sm text-[#6B7280] mt-1">{notification.message}</p>
                                  <p className="text-xs text-[#9CA3AF] mt-2">
                                    {new Date(notification.createdAt).toLocaleString("az-AZ")}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {!notification.isRead && (
                                    <button
                                      type="button"
                                      onClick={() => markAsRead(notification.id)}
                                      className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                      title="Oxundu kimi işarələ"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
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
                  </section>
                )}
              </>
            )}
          </motion.div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
