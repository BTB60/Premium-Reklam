"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Bell, User, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef, useMemo, type MouseEvent } from "react";
import { notifications } from "@/lib/db";
import type { Notification } from "@/lib/db";
import { useUnreadActivityDots } from "@/hooks/useUnreadActivityDots";
import { markAllSupportNotificationsAsRead } from "@/lib/db/messages";
import { markAllInAppNotificationsRead } from "@/lib/clientPaymentNotificationsApi";

interface HeaderProps {
  variant?: "public" | "decorator" | "admin";
  userName?: string;
  notifications?: number;
}

const publicNavItems = [
  { label: "Ana Səhvə", href: "/" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Xidmətlər", href: "/#services" },
  { label: "Necə işləyir", href: "/#how-it-works" },
  { label: "Əlaqə", href: "/#contact" },
];

const decoratorNavItems = [
  { label: "Ana Səhvə", href: "/" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Sifariş Yarat", href: "/orders/new" },
  { label: "Tarixçə", href: "/dashboard/orders" },
  { label: "Dəstək", href: "/dashboard/support" },
  { label: "Bildirişlər", href: "/notifications" },
  { label: "Tənzimləmələr", href: "/profile" },
];

const adminNavItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Sifarişlər", href: "/admin/orders" },
  { label: "İstifadəçilər", href: "/admin/users" },
  { label: "Maliyyə", href: "/admin/finance" },
];

/** Ana səhifədə ikən /#blok linkləri tam səhifə yeniləmədən scroll üçün */
function handlePublicHashNav(e: MouseEvent<HTMLAnchorElement>, href: string, onDone?: () => void) {
  if (!href.startsWith("/#")) return;
  if (typeof window === "undefined") return;
  if (window.location.pathname !== "/") return;
  e.preventDefault();
  const id = href.slice(2);
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", href);
  onDone?.();
}

function getSessionUserId(): string | null {
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

export function Header({ variant = "public", userName, notifications: propNotifications = 0 }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const activity = useUnreadActivityDots(variant === "decorator");

  const navItems =
    variant === "public"
      ? publicNavItems
      : variant === "decorator"
      ? decoratorNavItems
      : adminNavItems;

  // Use useMemo for notifications data
  const notificationData = useMemo(() => {
    if (variant === "public") {
      return { userNotifications: [], unreadCount: 0 };
    }
    const uid = getSessionUserId();
    const all = uid ? notifications.getByUserId(uid) : [];
    const unread = all.filter(n => !n.isRead);
    return {
      userNotifications: unread.slice(0, 5),
      unreadCount: unread.length || propNotifications
    };
  }, [variant, propNotifications]);

  const [userNotifications, setUserNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(propNotifications);

  // Sync useMemo result to state
  useEffect(() => {
    setUserNotifications(notificationData.userNotifications);
    setUnreadCount(notificationData.unreadCount);
  }, [notificationData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = (id: string) => {
    notifications.markAsRead(id);
    window.dispatchEvent(new CustomEvent("premium:inapp-mark-read", { detail: { ids: [id] } }));
    window.dispatchEvent(new Event("premium:local-notifications-changed"));
    const uid = getSessionUserId();
    const all = uid ? notifications.getByUserId(uid) : [];
    const unread = all.filter(n => !n.isRead);
    setUserNotifications(unread.slice(0, 5));
    setUnreadCount(unread.length);
    void activity.refresh();
  };

  const handleMarkAllNotificationsRead = async () => {
    const uid = getSessionUserId();
    if (!uid) return;

    const unread = notifications.getByUserId(uid).filter((n) => !n.isRead);
    unread.forEach((n) => notifications.markAsRead(n.id));
    try {
      await markAllInAppNotificationsRead();
    } catch {
      // Lokal bildirişlər oxundu edildi; server nöqtəsi növbəti refresh-də yenilənəcək.
    }
    window.dispatchEvent(new CustomEvent("premium:inapp-dismiss-all"));
    window.dispatchEvent(new Event("premium:local-notifications-changed"));
    setUserNotifications([]);
    setUnreadCount(0);
    void activity.refresh();
  };

  useEffect(() => {
    if (!supportOpen) return;
    const uid = getSessionUserId();
    if (!uid) return;
    markAllSupportNotificationsAsRead(uid);
    window.dispatchEvent(new Event("premium:local-notifications-changed"));
    void activity.refresh();
  }, [supportOpen, activity.refresh]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#E5E5E5] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Backup_of_YENILOGO.svg"
              alt="Premium Reklam"
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const msgDot = variant === "decorator" && item.href === "/dashboard/support" && activity.supportUnread > 0;
              const bellDot = variant === "decorator" && item.href === "/notifications" && activity.notifyUnread > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => variant === "public" && handlePublicHashNav(e, item.href)}
                  className="relative inline-flex items-center gap-1.5 px-4 py-2 text-[#4A4A4A] hover:text-[#C41E3A] font-medium text-sm transition-colors rounded-lg hover:bg-gray-50"
                >
                  {item.label}
                  {(msgDot || bellDot) && (
                    <span
                      className="w-2 h-2 rounded-full bg-[#C41E3A] shrink-0"
                      aria-hidden
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {variant !== "public" && (
              <>
                {/* Notification Bell */}
                <div className="relative" ref={notificationRef}>
                  <button 
                    onClick={() => setNotificationOpen(!notificationOpen)}
                    className="relative p-2.5 text-[#4A4A4A] hover:text-[#C41E3A] hover:bg-gray-100 rounded-xl transition-all"
                    type="button"
                    title={activity.notifyUnread > 0 ? "Yeni bildiriş" : "Bildirişlər"}
                  >
                    <Bell className="w-5 h-5" />
                    {activity.notifyUnread > 0 && (
                      <span
                        className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#C41E3A] ring-2 ring-white shadow-sm"
                        aria-label={`${activity.notifyUnread} oxunmamış`}
                      />
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  <AnimatePresence>
                    {notificationOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                      >
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                          <h3 className="font-semibold text-[#1F2937]">Bildirişlər</h3>
                          <div className="flex items-center gap-3">
                            {activity.notifyUnread > 0 && (
                              <button
                                type="button"
                                onClick={() => void handleMarkAllNotificationsRead()}
                                className="text-sm text-emerald-700 hover:underline"
                              >
                                Hamısını oxu
                              </button>
                            )}
                            <Link 
                              href="/notifications"
                              onClick={() => setNotificationOpen(false)}
                              className="text-sm text-[#D90429] hover:underline"
                            >
                              Hamısı
                            </Link>
                          </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {userNotifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Bildiriş yoxdur</p>
                            </div>
                          ) : (
                            userNotifications.map((notif) => (
                              <div
                                key={notif.id}
                                className={cn(
                                  "p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors",
                                  !notif.isRead && "bg-blue-50/50"
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                    notif.type === "order_status" ? "bg-emerald-100 text-emerald-600" :
                                    notif.type === "payment" ? "bg-amber-100 text-amber-600" :
                                    "bg-blue-100 text-blue-600"
                                  )}>
                                    <Bell className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#1F2937]">{notif.title}</p>
                                    <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-2">{notif.message}</p>
                                    <p className="text-xs text-[#9CA3AF] mt-1">
                                      {new Date(notif.createdAt).toLocaleString("az-AZ", { 
                                        day: "numeric", 
                                        month: "short", 
                                        hour: "2-digit", 
                                        minute: "2-digit" 
                                      })}
                                    </p>
                                  </div>
                                  {!notif.isRead && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsRead(notif.id);
                                      }}
                                      className="text-xs text-[#D90429] hover:underline"
                                    >
                                      Oxundu
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Live Support Button */}
                <button 
                  onClick={() => setSupportOpen(true)}
                  className="relative p-2.5 text-[#4A4A4A] hover:text-[#059669] hover:bg-gray-100 rounded-xl transition-all"
                  title="Canlı Dəstək"
                  type="button"
                >
                  <MessageCircle className="w-5 h-5" />
                  {activity.supportUnread > 0 && (
                    <span
                      className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#059669] ring-2 ring-white shadow-sm"
                      aria-label={`${activity.supportUnread} oxunmamış mesaj`}
                    />
                  )}
                </button>

                <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-gray-200">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C41E3A] to-[#9A1529] flex items-center justify-center text-white shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-[#0A0A0A]">{userName}</span>
                </div>
              </>
            )}
            
            {variant === "public" && (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-[#0A0A0A] font-medium hover:text-[#C41E3A] transition-colors text-sm"
                >
                  Daxil ol
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#C41E3A] to-[#9A1529] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all text-sm hidden sm:inline-block"
                >
                  Qeydiyyat
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 text-[#4A4A4A] hover:bg-gray-100 rounded-xl transition-all"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-[#E5E5E5] shadow-lg"
          >
            <nav className="px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const msgDotM =
                  variant === "decorator" && item.href === "/dashboard/support" && activity.supportUnread > 0;
                const bellDotM =
                  variant === "decorator" && item.href === "/notifications" && activity.notifyUnread > 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      if (variant === "public") {
                        handlePublicHashNav(e, item.href, () => setMobileMenuOpen(false));
                        if (e.defaultPrevented) return;
                      }
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between gap-2 px-4 py-3.5 text-[#4A4A4A] hover:text-[#C41E3A] hover:bg-gray-50 rounded-xl font-medium transition-colors"
                  >
                    <span>{item.label}</span>
                    {(msgDotM || bellDotM) && (
                      <span className="w-2 h-2 rounded-full bg-[#C41E3A] shrink-0" aria-hidden />
                    )}
                  </Link>
                );
              })}
              {variant === "public" && (
                <div className="pt-4 mt-4 border-t border-[#E5E5E5] space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3.5 text-[#0A0A0A] font-medium bg-gray-50 rounded-xl text-center"
                  >
                    Daxil ol
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3.5 bg-gradient-to-r from-[#C41E3A] to-[#9A1529] text-white font-semibold rounded-xl text-center shadow-sm"
                  >
                    Qeydiyyat
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Support Modal */}
      <AnimatePresence>
        {supportOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSupportOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-50 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              style={{ maxHeight: "80vh" }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Canlı Dəstək</h3>
                    <p className="text-sm text-white/80">Premium Reklam</p>
                  </div>
                </div>
                <button
                  onClick={() => setSupportOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 overflow-y-auto">
                <p className="text-gray-600 mb-4">
                  Salam! Sizə necə kömək edə bilərik?
                </p>

                <div className="space-y-3">
                  <a
                    href="https://wa.me/994507988177?text=Salam,+məlumat+almaq+istəyirəm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1F2937]">WhatsApp ilə yazın</p>
                      <p className="text-sm text-[#6B7280]">Sürətli cavab</p>
                    </div>
                  </a>

                  <a
                    href="tel:+994507988177"
                    className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <div className="w-10 h-10 bg-[#D90429] rounded-full flex items-center justify-center text-white">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1F2937]">Zəng edin</p>
                      <p className="text-sm text-[#6B7280]">+994 50 798 81 77</p>
                    </div>
                  </a>

                  <Link
                    href="/dashboard/support"
                    onClick={() => setSupportOpen(false)}
                    className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <div className="w-10 h-10 bg-[#4F46E5] rounded-full flex items-center justify-center text-white">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1F2937]">Mesaj göndərin</p>
                      <p className="text-sm text-[#6B7280]">Adminəlangicə cavab</p>
                    </div>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
