/** Vahid bildiriş səsi — `public/audio` altında. */
export const PREMIUM_NOTIFICATION_MP3_PATH =
  "/audio/universfield-new-notification-021-370045.mp3";

let lastAudio: HTMLAudioElement | null = null;
let lastPlayAt = 0;
/** STOMP + çat polling eyni hadisə üçün təkrarlanmasın. */
const MIN_GAP_MS = 900;

export function playPremiumNotificationSound(): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastPlayAt < MIN_GAP_MS) return;
  lastPlayAt = now;
  try {
    if (lastAudio) {
      lastAudio.pause();
      lastAudio.currentTime = 0;
    }
    const audio = new Audio(PREMIUM_NOTIFICATION_MP3_PATH);
    audio.volume = 0.9;
    lastAudio = audio;
    void audio.play().catch(() => {});
  } catch {
    /* ignore */
  }
}
