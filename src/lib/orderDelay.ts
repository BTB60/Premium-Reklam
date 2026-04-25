export function isFinalOrderStatus(status?: string | null): boolean {
  const s = String(status || "").toLowerCase();
  return s === "completed" || s === "bitdi" || s === "cancelled" || s === "canceled";
}

export function isWaitingOrderStatus(status?: string | null): boolean {
  const s = String(status || "").toLowerCase().trim();
  return s === "pending" || s === "təsdiq" || s === "tesdiq" || s === "gözləyir" || s === "gozleyir";
}

export function shouldShowReadyCountdown(order: {
  status?: string | null;
  estimatedReadyAt?: string | null;
}): boolean {
  return Boolean(order.estimatedReadyAt) && !isFinalOrderStatus(order.status) && !isWaitingOrderStatus(order.status);
}

export function isOrderOverdue(order: {
  status?: string | null;
  estimatedReadyAt?: string | null;
}): boolean {
  if (!order.estimatedReadyAt || isFinalOrderStatus(order.status)) return false;
  const due = new Date(order.estimatedReadyAt).getTime();
  return Number.isFinite(due) && due < Date.now();
}

export function isOrderStale(order: {
  status?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
}, days = 3): boolean {
  if (isFinalOrderStatus(order.status)) return false;
  const raw = order.updatedAt || order.createdAt;
  if (!raw) return false;
  const last = new Date(raw).getTime();
  return Number.isFinite(last) && Date.now() - last > days * 24 * 60 * 60 * 1000;
}

export function formatDateTimeLocalValue(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function dateTimeLocalToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function getReadyCountdownParts(value?: string | null, nowMs = Date.now()): {
  overdue: boolean;
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} | null {
  if (!value) return null;
  const target = new Date(value).getTime();
  if (!Number.isFinite(target)) return null;
  const diff = target - nowMs;
  const abs = Math.abs(diff);
  const days = Math.floor(abs / 86_400_000);
  const hours = Math.floor((abs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((abs % 3_600_000) / 60_000);
  const seconds = Math.floor((abs % 60_000) / 1000);
  return { overdue: diff < 0, totalMs: diff, days, hours, minutes, seconds };
}

export function formatReadyCountdown(value?: string | null, nowMs = Date.now()): string {
  const parts = getReadyCountdownParts(value, nowMs);
  if (!parts) return "";
  const prefix = parts.overdue ? "Gecikir: " : "Qalıb: ";
  if (parts.days > 0) return `${prefix}${parts.days}g ${parts.hours}s ${parts.minutes}d`;
  if (parts.hours > 0) return `${prefix}${parts.hours}s ${parts.minutes}d`;
  return `${prefix}${parts.minutes}d ${parts.seconds}san`;
}
