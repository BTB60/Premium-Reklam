export function getAdminDashboardApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : "https://premium-reklam-backend.onrender.com/api";
}

const SUBADMIN_JWT_KEY = "premium_subadmin_jwt";
const SUBADMIN_SESSION_KEY = "premium_subadmin_session";

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
    const raw = sessionStorage.getItem(SUBADMIN_JWT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { token?: string };
      if (parsed?.token) return parsed.token;
    }
  } catch {
    /* ignore */
  }
  try {
    const raw = sessionStorage.getItem(SUBADMIN_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { token?: string };
      if (parsed?.token) return parsed.token;
    }
  } catch {
    /* ignore */
  }
  return null;
}
