export function getAdminDashboardApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : "https://premium-reklam-backend.onrender.com/api";
}

export function getAdminBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("decor_current_user");
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return parsed?.token || null;
  } catch {
    return null;
  }
}
