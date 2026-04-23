"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";
import { getRealtimeBearerToken } from "@/app/admin/dashboard/components/admin-dashboard-api";
import { cn } from "@/lib/utils";
import { getBackendOrigin } from "@/lib/restApiBase";
import { playPremiumNotificationSound } from "@/lib/notificationSound";

export type ToastItem = { id: string; message: string; event: string };
const DISMISSED_KEY = "premium_dismissed_toast_ids";

function loadDismissedIds(): Set<string> {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set<string>();
    const list = JSON.parse(raw) as string[];
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set<string>();
  }
}

function persistDismissedIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(ids).slice(-500)));
  } catch {
    /* ignore */
  }
}

function resolveSubs(): { adminTopic: boolean; userQueue: boolean } {
  if (typeof window === "undefined") return { adminTopic: false, userQueue: false };
  if (localStorage.getItem("premium_session_type") === "subadmin") {
    return { adminTopic: true, userQueue: false };
  }
  const raw = localStorage.getItem("decor_current_user");
  if (!raw) return { adminTopic: false, userQueue: false };
  try {
    const p = JSON.parse(raw) as { role?: string };
    const role = String(p.role || "").trim().toUpperCase();
    if (role === "ADMIN" || role === "ROLE_ADMIN" || role === "SUBADMIN" || role === "ROLE_SUBADMIN") {
      return { adminTopic: true, userQueue: false };
    }
    return { adminTopic: false, userQueue: true };
  } catch {
    return { adminTopic: false, userQueue: false };
  }
}

function parsePayload(body: string): {
  event: string;
  message?: string;
  soundProfile?: string;
  dedupeKey?: string;
} {
  try {
    return JSON.parse(body) as {
      event: string;
      message?: string;
      soundProfile?: string;
      dedupeKey?: string;
    };
  } catch {
    return { event: "UNKNOWN", message: body };
  }
}

export function RealtimeNotificationsHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const visibleDedupeRef = useRef(new Set<string>());
  const lastEmitRef = useRef<Record<string, number>>({});
  const dismissedRef = useRef<Set<string>>(new Set<string>());

  const removeToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    visibleDedupeRef.current.delete(id);
  }, []);

  const dismissAll = useCallback(() => {
    setToasts((prev) => {
      const nextDismissed = dismissedRef.current;
      prev.forEach((t) => nextDismissed.add(t.id));
      persistDismissedIds(nextDismissed);
      visibleDedupeRef.current.clear();
      return [];
    });
  }, []);

  const pushToast = useCallback(
    (dedupeKey: string, message: string, event: string) => {
      if (dismissedRef.current.has(dedupeKey)) return;
      const now = Date.now();
      if (visibleDedupeRef.current.has(dedupeKey)) return;
      const last = lastEmitRef.current[dedupeKey] ?? 0;
      if (now - last < 900) return;
      lastEmitRef.current[dedupeKey] = now;
      visibleDedupeRef.current.add(dedupeKey);
      setToasts((prev) => [...prev, { id: dedupeKey, message: message || event, event }]);
      window.setTimeout(() => removeToast(dedupeKey), 8500);
    },
    [removeToast]
  );

  const playSound = useCallback(() => {
    playPremiumNotificationSound();
  }, []);

  const latest = useRef({ onMsg: (_msg: IMessage) => {} });

  useEffect(() => {
    latest.current.onMsg = (msg: IMessage) => {
      const p = parsePayload(msg.body);
      const key = p.dedupeKey || `${p.event}-${p.message ?? ""}`;
      pushToast(key, p.message || p.event, p.event);
      playSound();
      if (p.event === "PAYMENT_PENDING") {
        window.dispatchEvent(new CustomEvent("premium:refresh-client-payment-requests"));
      }
      if (p.event === "STORE_REQUEST_PENDING") {
        window.dispatchEvent(new CustomEvent("premium:refresh-store-requests"));
      }
      if (p.event === "PAYMENT_APPROVED" || p.event === "PAYMENT_ACCEPTED" || p.event === "DEBT_INCREASED") {
        window.dispatchEvent(new CustomEvent("premium:user-balance-updated"));
      }
      if (p.event === "NEW_ORDER") {
        window.dispatchEvent(new CustomEvent("premium:refresh-admin-orders"));
      }
      if (p.event === "ORDER_STATUS") {
        window.dispatchEvent(new CustomEvent("premium:refresh-user-orders"));
      }
      if (p.event === "SUPPORT_MESSAGE") {
        window.dispatchEvent(new CustomEvent("premium:support-admin-refresh"));
      }
      if (p.event === "SUPPORT_REPLY") {
        window.dispatchEvent(new CustomEvent("premium:support-chat-refresh"));
      }
    };
  }, [playSound, pushToast]);

  useEffect(() => {
    dismissedRef.current = loadDismissedIds();
  }, []);

  useEffect(() => {
    const onDismissAll = () => dismissAll();
    const onMarkRead = (e: Event) => {
      const custom = e as CustomEvent<{ ids?: string[] }>;
      const ids = custom.detail?.ids || [];
      if (ids.length === 0) return;
      ids.forEach((id) => dismissedRef.current.add(id));
      persistDismissedIds(dismissedRef.current);
      setToasts((prev) => prev.filter((t) => !ids.includes(t.id)));
      ids.forEach((id) => visibleDedupeRef.current.delete(id));
    };
    window.addEventListener("premium:inapp-dismiss-all", onDismissAll);
    window.addEventListener("premium:inapp-mark-read", onMarkRead as EventListener);
    return () => {
      window.removeEventListener("premium:inapp-dismiss-all", onDismissAll);
      window.removeEventListener("premium:inapp-mark-read", onMarkRead as EventListener);
    };
  }, [dismissAll]);

  useEffect(() => {
    const token = getRealtimeBearerToken();
    const { adminTopic, userQueue } = resolveSubs();
    if (!token || (!adminTopic && !userQueue)) {
      return undefined;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`${getBackendOrigin()}/ws`) as unknown as WebSocket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 8000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        if (adminTopic) {
          client.subscribe("/topic/admin/payment-events", (m) => latest.current.onMsg(m));
        }
        if (userQueue) {
          client.subscribe("/user/queue/notifications", (m) => latest.current.onMsg(m));
        }
      },
      onStompError: (frame) => {
        console.warn("[STOMP]", frame.headers?.message);
      },
    });

    client.activate();

    return () => {
      void client.deactivate();
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={cn(
            "rounded-xl border border-gray-200 bg-white shadow-lg p-4 text-sm text-gray-900",
            "transition-all duration-200"
          )}
        >
          <div className="font-semibold text-[#ff6600] mb-1">{t.event}</div>
          <p className="text-gray-700">{t.message}</p>
          <button
            type="button"
            className="mt-2 text-xs text-gray-500 hover:text-gray-800"
            onClick={() => removeToast(t.id)}
          >
            Bağla
          </button>
        </div>
      ))}
    </div>
  );
}
