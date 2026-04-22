import { getRestApiBase } from "./restApiBase";

export interface AdminAuditEntry {
  id: string;
  action: string;
  actor: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

const AUDIT_LOG_KEY = "premium_admin_audit_logs";

function getCurrentActor(): string {
  if (typeof window === "undefined") return "unknown";
  try {
    const raw = localStorage.getItem("decor_current_user");
    if (!raw) return "unknown";
    const user = JSON.parse(raw);
    return user?.username || user?.fullName || "unknown";
  } catch {
    return "unknown";
  }
}

export async function logAdminAction(action: string, payload?: Record<string, unknown>) {
  const entry: AdminAuditEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    actor: getCurrentActor(),
    payload,
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      const existingRaw = localStorage.getItem(AUDIT_LOG_KEY);
      const existing: AdminAuditEntry[] = existingRaw ? JSON.parse(existingRaw) : [];
      const next = [entry, ...existing].slice(0, 500);
      localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(next));
    } catch (error) {
      console.warn("[Audit] Failed to persist local audit log", error);
    }
  }

  try {
    await fetch(`${getRestApiBase()}/audit-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
  } catch {
    // Backend endpoint may not exist yet; local persistence still works.
  }
}

export function getLocalAdminAuditLogs(): AdminAuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
