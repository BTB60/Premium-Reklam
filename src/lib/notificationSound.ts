/** Ümumi bildirişlər (sifariş, ödəniş və s.) */
export const PREMIUM_NOTIFICATION_MP3_PATH =
  "/audio/universfield-new-notification-021-370045.mp3";

/** Canlı dəstək mesajları — `mesaj sesi` */
export const SUPPORT_CHAT_MESSAGE_MP3_PATH = "/audio/mesaj-sesi.mp3";

let lastAudio: HTMLAudioElement | null = null;
let lastPlayAt = 0;
/** STOMP + çat polling eyni hadisə üçün təkrarlanmasın. */
const MIN_GAP_MS = 900;

function playNotificationSrc(src: string, volume = 0.9): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastPlayAt < MIN_GAP_MS) return;
  lastPlayAt = now;
  try {
    if (lastAudio) {
      lastAudio.pause();
      lastAudio.currentTime = 0;
    }
    const audio = new Audio(src);
    audio.volume = volume;
    lastAudio = audio;
    void audio.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

const LS_SUPPORT_SOUND_USER = "premium_support_sound_user";
const LS_SUPPORT_SOUND_ADMIN = "premium_support_sound_admin";

export function readSupportChatSoundEnabled(side: "user" | "admin"): boolean {
  if (typeof window === "undefined") return true;
  try {
    const key = side === "user" ? LS_SUPPORT_SOUND_USER : LS_SUPPORT_SOUND_ADMIN;
    const v = localStorage.getItem(key);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function writeSupportChatSoundEnabled(side: "user" | "admin", enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const key = side === "user" ? LS_SUPPORT_SOUND_USER : LS_SUPPORT_SOUND_ADMIN;
    localStorage.setItem(key, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function playPremiumNotificationSound(): void {
  playNotificationSrc(PREMIUM_NOTIFICATION_MP3_PATH);
}

/** Canlı dəstək mesajı — `mesaj-sesi.mp3`, brauzer seçiminə görə. */
export function playSupportChatNotificationSound(side: "user" | "admin"): void {
  if (!readSupportChatSoundEnabled(side)) return;
  playNotificationSrc(SUPPORT_CHAT_MESSAGE_MP3_PATH);
}

/** Gözləmə mərhələsindən (pending / təsdiq və s.) «approved»-a keçəndə — admin əməliyyatı üçün bildiriş səsi. */
const ORDER_WAITING_NORMALIZED = new Set(["pending", "pencil", "təsdiq", "gözləyir", "gozleyir"]);

function normalizeOrderStatusToken(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase();
}

export function playPremiumNotificationIfOrderWaitToApproved(
  order: unknown,
  nextStatus: string
): void {
  const next = normalizeOrderStatusToken(nextStatus);
  if (next !== "approved") return;
  const o = order as Record<string, unknown> | null | undefined;
  if (!o) return;
  const st = normalizeOrderStatusToken(o.status);
  const wf = normalizeOrderStatusToken(o.workflowStatus ?? o.workflow_status);
  if (!ORDER_WAITING_NORMALIZED.has(st) && !ORDER_WAITING_NORMALIZED.has(wf)) return;
  playPremiumNotificationSound();
}
