export function isFinalOrderStatus(status?: string | null): boolean {
  const s = String(status || "").toLowerCase();
  return s === "completed" || s === "bitdi" || s === "cancelled" || s === "canceled";
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
