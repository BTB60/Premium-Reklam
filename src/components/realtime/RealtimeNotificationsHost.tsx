"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";
import { getAdminBearerToken } from "@/app/admin/dashboard/components/admin-dashboard-api";
import { cn } from "@/lib/utils";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL
  : "https://premium-reklam-backend.onrender.com";

export type ToastItem = { id: string; message: string; event: string };

function resolveSubs(): { adminTopic: boolean; userQueue: boolean } {
  if (typeof window === "undefined") return { adminTopic: false, userQueue: false };
  if (localStorage.getItem("premium_session_type") === "subadmin") {
    return { adminTopic: true, userQueue: false };
  }
  const raw = localStorage.getItem("decor_current_user");
  if (!raw) return { adminTopic: false, userQueue: false };
  try {
    const p = JSON.parse(raw) as { role?: string };
    if (p.role === "ADMIN") return { adminTopic: true, userQueue: false };
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
  const soundAllowedRef = useRef(false);
  const playingRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    visibleDedupeRef.current.delete(id);
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
    visibleDedupeRef.current.clear();
    if (playingRef.current) {
      playingRef.current.pause();
      playingRef.current.currentTime = 0;
      playingRef.current = null;
    }
  }, []);

  const pushToast = useCallback(
    (dedupeKey: string, message: string, event: string) => {
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

  const playSound = useCallback((profile: string | undefined) => {
    if (!soundAllowedRef.current) return;
    const src =
      profile === "admin" ? "/audio/notification_admin.mp3" : "/audio/notification_user.mp3";
    const audio = new Audio(src);
    if (playingRef.current) {
      playingRef.current.pause();
      playingRef.current.currentTime = 0;
    }
    playingRef.current = audio;
    void audio.play().catch(() => {});
  }, []);

  const latest = useRef({ onMsg: (_msg: IMessage) => {} });

  useEffect(() => {
    latest.current.onMsg = (msg: IMessage) => {
      const p = parsePayload(msg.body);
      const key = p.dedupeKey || `${p.event}-${p.message ?? ""}`;
      pushToast(key, p.message || p.event, p.event);
      playSound(p.soundProfile);
      if (p.event === "PAYMENT_PENDING") {
        window.dispatchEvent(new CustomEvent("premium:refresh-client-payment-requests"));
      }
    };
  }, [playSound, pushToast]);

  useEffect(() => {
    const unlock = () => {
      soundAllowedRef.current = true;
      try {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AC && !audioCtxRef.current) {
          audioCtxRef.current = new AC();
          void audioCtxRef.current.resume();
        }
      } catch {
        /* ignore */
      }
    };
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    const onDismissAll = () => dismissAll();
    window.addEventListener("premium:inapp-dismiss-all", onDismissAll);
    return () => window.removeEventListener("premium:inapp-dismiss-all", onDismissAll);
  }, [dismissAll]);

  useEffect(() => {
    const token = getAdminBearerToken();
    const { adminTopic, userQueue } = resolveSubs();
    if (!token || (!adminTopic && !userQueue)) {
      return undefined;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_ORIGIN}/ws`) as unknown as WebSocket,
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
