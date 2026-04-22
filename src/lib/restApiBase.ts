const DEFAULT_ORIGIN = "https://premium-reklam-backend.onrender.com";

function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

/** Backend kökü (məs. https://....onrender.com), /api daxil deyil. */
export function getBackendOrigin(): string {
  return stripTrailingSlash(process.env.NEXT_PUBLIC_API_URL || DEFAULT_ORIGIN);
}

/**
 * REST çağırışları üçün /api prefiksi ilə base.
 * Brauzerdə: `/api/backend` (Next Route Handler → Render) — CORS və köhnə `rewrites` 403 problemini azaldır.
 * Server (RSC): birbaşa backend. Məcburi birbaşa URL: NEXT_PUBLIC_API_DIRECT=1
 */
export function getRestApiBase(): string {
  const origin = getBackendOrigin();
  const direct = `${origin}/api`;
  if (process.env.NEXT_PUBLIC_API_DIRECT === "1") return direct;
  if (typeof window !== "undefined") return "/api/backend";
  return direct;
}
