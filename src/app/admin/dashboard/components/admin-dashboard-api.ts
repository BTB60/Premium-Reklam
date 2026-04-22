import { getRestApiBase } from "@/lib/restApiBase";

export function getAdminDashboardApiBase(): string {
  return getRestApiBase();
}

const SUBADMIN_JWT_KEY = "premium_subadmin_jwt";
const SUBADMIN_SESSION_KEY = "premium_subadmin_session";

function extractToken(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as { token?: string };
    if (parsed?.token && typeof parsed.token === "string") return parsed.token;
  } catch {
    // Backward compatibility: older sessions may store plain JWT string.
  }
  if (trimmed.includes(".") && !trimmed.startsWith("{")) return trimmed;
  return null;
}

function normalizeRole(raw?: string): string {
  const role = String(raw || "").trim().toUpperCase();
  if (role.startsWith("ROLE_")) return role.slice(5);
  return role;
}

/** Admin JWT (localStorage) və ya subadmin JWT (sessionStorage — backend /auth/subadmin/login). */
export function getAdminBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const admin = localStorage.getItem("decor_current_user");
    if (admin) {
      const parsed = JSON.parse(admin) as { token?: string; role?: string };
      const role = normalizeRole(parsed?.role);
      if (parsed?.token && (role === "ADMIN" || role === "SUBADMIN")) {
        return parsed.token as string;
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const token = extractToken(sessionStorage.getItem(SUBADMIN_JWT_KEY));
    if (token) return token;
  } catch {
    /* ignore */
  }
  try {
    const token = extractToken(sessionStorage.getItem(SUBADMIN_SESSION_KEY));
    if (token) return token;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * WebSocket / STOMP üçün: hər hansı rol (müştəri də daxil) — `decor_current_user.token`,
 * və ya subadmin JWT. Admin üçün `getAdminBearerToken` ilə eyni nəticə.
 */
export function getRealtimeBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("decor_current_user");
    if (raw) {
      const parsed = JSON.parse(raw) as { token?: string };
      if (parsed?.token && typeof parsed.token === "string") return parsed.token;
    }
  } catch {
    /* ignore */
  }
  try {
    const token = extractToken(sessionStorage.getItem(SUBADMIN_JWT_KEY));
    if (token) return token;
  } catch {
    /* ignore */
  }
  try {
    const token = extractToken(sessionStorage.getItem(SUBADMIN_SESSION_KEY));
    if (token) return token;
  } catch {
    /* ignore */
  }
  return null;
}
