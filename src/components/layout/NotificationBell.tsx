"use client";
import { useState, useEffect, useCallback } from "react";
import { Bell, Headphones } from "lucide-react";
import { announcementApi } from "@/lib/authApi";
import { getUnreadSupportNotifications } from "@/lib/db/messages";
import Link from "next/link";

const READ_IDS_KEY = "read_announcement_ids";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [supportUnread, setSupportUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const getReadIds = useCallback((): string[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(READ_IDS_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.map((id: any) => String(id)) : [];
    } catch { return []; }
  }, []);

  const load = useCallback(async () => {
    try {
      // Загрузка объявлений
      const list = await announcementApi.getActive();
      const active = list.filter((a: any) => a.isActive === true);
      const read = getReadIds();
      const unread = active.filter((n: any) => !read.includes(String(n.id))).length;
      
      // Загрузка непрочитанных сообщений поддержки
      const currentUser = JSON.parse(localStorage.getItem("decor_current_user") || "null");
      const supportUnreadCount = currentUser?.id 
        ? getUnreadSupportNotifications(currentUser.id).length 
        : 0;
      
      setUnreadCount(unread);
      setSupportUnread(supportUnreadCount);
      setLoaded(true);
    } catch (e) {
      console.error("[Bell] Error:", e);
      setLoaded(true);
    }
  }, [getReadIds]);

  useEffect(() => {
    load();
    
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    
    const onStorage = (e: StorageEvent) => {
      if (e.key === READ_IDS_KEY || e.key === "decor_support_notifications") {
        load();
      }
    };
    window.addEventListener("storage", onStorage);
    
    // Custom event для intra-tab синхронизации
    const onCustomStorage = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.key === "decor_support_notifications") {
        load();
      }
    };
    window.addEventListener("storage:decor_support_notifications", onCustomStorage as EventListener);
    
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("storage:decor_support_notifications", onCustomStorage as EventListener);
    };
  }, [load]);

  const totalUnread = unreadCount + supportUnread;

  return (
    <Link href="/notifications" className="relative p-2.5 text-[#4A4A4A] hover:text-[#C41E3A] hover:bg-gray-100 rounded-xl transition-all">
      <Bell className="w-5 h-5" />
      
      {/* Бейдж для объявлений */}
      {loaded && unreadCount > 0 && supportUnread === 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#C41E3A] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
      
      {/* Индикатор для сообщений поддержки (отдельная иконка) */}
      {loaded && supportUnread > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm border-2 border-white">
          {supportUnread > 9 ? "9+" : supportUnread}
        </span>
      )}
      
      {/* Общий бейдж если есть и то и другое */}
      {loaded && unreadCount > 0 && supportUnread > 0 && (
        <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#C41E3A] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm border-2 border-white">
          {totalUnread > 9 ? "9+" : totalUnread}
        </span>
      )}
    </Link>
  );
}