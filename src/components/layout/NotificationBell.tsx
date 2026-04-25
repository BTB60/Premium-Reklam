"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Megaphone, Headphones } from "lucide-react";
import { announcementApi } from "@/lib/authApi";
import { notifications as notificationsStore } from "@/lib/db";
import {
  getUnreadSupportNotifications,
  markAllSupportNotificationsAsRead,
} from "@/lib/db/messages";
import type { Notification } from "@/lib/db/types";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  fetchMyInAppNotifications,
  markAllInAppNotificationsRead,
} from "@/lib/clientPaymentNotificationsApi";

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

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [announcementCount, setAnnouncementCount] = useState(0);
  const [personalUnread, setPersonalUnread] = useState(0);
  const [supportUnread, setSupportUnread] = useState(0);
  const [preview, setPreview] = useState<{
    announcements: { id: string; title: string }[];
    personal: { id: string; title: string }[];
  }>({ announcements: [], personal: [] });
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const uid = getSessionUserId();
    try {
      const list = await announcementApi.getActive();
      const active = Array.isArray(list) ? list.filter((a: { isActive?: boolean }) => a.isActive !== false) : [];
      const personal: Notification[] = uid ? notificationsStore.getByUserId(uid) : [];
      const unreadServer = await fetchMyInAppNotifications().catch(() => []);
      const unreadP = [
        ...unreadServer
          .filter((n) => !n.isRead)
          .map((n) => ({ id: `srv-${n.id}`, title: String(n.type || "SYSTEM") })),
        ...personal.filter((n) => !n.isRead).map((n) => ({ id: n.id, title: n.title })),
      ];
      const sup = uid ? getUnreadSupportNotifications(uid) : [];

      setAnnouncementCount(active.length);
      setPersonalUnread(unreadP.length);
      setSupportUnread(sup.length);
      setPreview({
        announcements: active.slice(0, 3).map((a: { id?: string | number; title?: string }) => ({
          id: String(a.id ?? ""),
          title: a.title || "Elan",
        })),
        personal: unreadP.slice(0, 3).map((n) => ({ id: n.id, title: n.title })),
      });
    } catch (e) {
      console.error("[NotificationBell]", e);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const markAllAsRead = useCallback(async () => {
    const uid = getSessionUserId();
    if (!uid) return;

    const localUnreadIds = notificationsStore
      .getByUserId(uid)
      .filter((n) => !n.isRead)
      .map((n) => n.id);
    localUnreadIds.forEach((id) => notificationsStore.markAsRead(id));

    try {
      await markAllInAppNotificationsRead();
    } catch {
      // Lokal bildirişlər onsuz da oxundu edildi; server xətası nöqtəni növbəti yükləmədə düzəldəcək.
    }

    markAllSupportNotificationsAsRead(uid);
    window.dispatchEvent(new CustomEvent("premium:inapp-dismiss-all"));
    window.dispatchEvent(new Event("premium:local-notifications-changed"));
    setPersonalUnread(0);
    setSupportUnread(0);
    setPreview((prev) => ({ ...prev, personal: [] }));
    void load();
  }, [load]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const totalBadge = announcementCount + personalUnread + supportUnread;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2.5 text-[#4A4A4A] hover:text-[#C41E3A] hover:bg-gray-100 rounded-xl transition-all"
        aria-expanded={open}
        aria-haspopup="true"
        title="Bildirişlər"
      >
        <Bell className="w-5 h-5" />
        {loaded && totalBadge > 0 && (
          <span
            className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-[#C41E3A] ring-2 ring-white shadow-sm"
            aria-label={`${totalBadge} yeni bildiriş və ya mesaj`}
          />
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-gray-100 bg-white shadow-xl z-[60] overflow-hidden"
          )}
        >
          <div className="p-3 border-b border-gray-100 flex items-center justify-between gap-2">
            <span className="font-semibold text-[#1F2937] text-sm">Bildirişlər</span>
            <div className="flex items-center gap-3 shrink-0">
              {(personalUnread > 0 || supportUnread > 0) && (
                <button
                  type="button"
                  onClick={() => void markAllAsRead()}
                  className="text-xs text-emerald-700 font-medium hover:underline"
                >
                  Hamısını oxu
                </button>
              )}
              <Link
                href="/notifications"
                className="text-xs text-[#D90429] font-medium hover:underline"
                onClick={() => setOpen(false)}
              >
                Hamısı
              </Link>
            </div>
          </div>

          <div className="max-h-[min(70vh,320px)] overflow-y-auto text-sm">
            {supportUnread > 0 && (
              <Link
                href="/dashboard/support"
                onClick={() => setOpen(false)}
                className="flex items-start gap-2 p-3 border-b border-emerald-100 bg-emerald-50/60 hover:bg-emerald-50"
              >
                <Headphones className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-[#1F2937]">Dəstək: {supportUnread} oxunmamış</p>
                  <p className="text-xs text-[#6B7280]">Mesajları görmək üçün toxunun</p>
                </div>
              </Link>
            )}

            {preview.announcements.length > 0 && (
              <div className="border-b border-gray-50">
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF] flex items-center gap-1">
                  <Megaphone className="w-3 h-3" /> Elanlar
                </p>
                {preview.announcements.map((a) => (
                  <div key={a.id} className="px-3 py-2 text-[#1F2937] border-t border-gray-50 first:border-t-0">
                    <span className="line-clamp-2">{a.title}</span>
                  </div>
                ))}
              </div>
            )}

            {preview.personal.length > 0 && (
              <div>
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF] flex items-center gap-1">
                  <Bell className="w-3 h-3" /> Şəxsi
                </p>
                {preview.personal.map((n) => (
                  <div key={n.id} className="px-3 py-2 text-[#1F2937] border-t border-gray-50">
                    <span className="line-clamp-2 font-medium">{n.title}</span>
                  </div>
                ))}
              </div>
            )}

            {loaded &&
              preview.announcements.length === 0 &&
              preview.personal.length === 0 &&
              supportUnread === 0 && (
                <div className="p-6 text-center text-[#6B7280] text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Hazırda bildiriş yoxdur
                </div>
              )}
          </div>

          <div className="p-2 border-t border-gray-100 bg-[#FAFAFA]">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block w-full text-center py-2 text-sm font-medium text-[#D90429] hover:bg-white rounded-lg transition-colors"
            >
              Bütün bildirişlər
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
