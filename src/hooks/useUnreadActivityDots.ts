"use client";

import { useCallback, useEffect, useState } from "react";
import { notifications } from "@/lib/db";
import { getUnreadSupportNotifications } from "@/lib/db/messages";
import { fetchMyInAppNotifications } from "@/lib/clientPaymentNotificationsApi";

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

/**
 * Müştəri üçün: oxunmamış bildiriş (lokal + server) və dəstək mesajı göstəricisi.
 * `enabled` false olanda sorğu olunmur (məs. public səhifə).
 */
export function useUnreadActivityDots(enabled: boolean) {
  const [supportUnread, setSupportUnread] = useState(0);
  const [notifyUnread, setNotifyUnread] = useState(0);

  const refresh = useCallback(async () => {
    if (!enabled || typeof window === "undefined") {
      setSupportUnread(0);
      setNotifyUnread(0);
      return;
    }
    const uid = getSessionUserId();
    try {
      const sup = uid ? getUnreadSupportNotifications(uid).length : 0;
      const personal = uid ? notifications.getByUserId(uid).filter((n) => !n.isRead).length : 0;
      const srv = await fetchMyInAppNotifications().catch(() => []);
      const su = srv.filter((n) => !n.isRead).length;
      setSupportUnread(sup);
      setNotifyUnread(personal + su);
    } catch {
      setSupportUnread(0);
      setNotifyUnread(0);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => void refresh(), 45000);
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const onFocus = () => void refresh();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    window.addEventListener("premium:inapp-dismiss-all", refresh);
    window.addEventListener("premium:inapp-mark-read", refresh);
    window.addEventListener("premium:local-notifications-changed", refresh);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("premium:inapp-dismiss-all", refresh);
      window.removeEventListener("premium:inapp-mark-read", refresh);
      window.removeEventListener("premium:local-notifications-changed", refresh);
    };
  }, [enabled, refresh]);

  return {
    supportUnread,
    notifyUnread,
    refresh,
  };
}
