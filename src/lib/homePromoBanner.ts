import { getFromStorage, saveToStorage, removeFromStorage } from "@/lib/db/storage";
import { getBackendOrigin } from "@/lib/restApiBase";

export const HOME_PROMO_BANNER_KEY = "premium_home_promo_campaigns";

export type PromoCampaignType = "first_order" | "referral" | "limited_time" | "seasonal";

/** localStorage üçün (tarix ISO string) */
export interface PromoCampaignStored {
  id: string;
  type: PromoCampaignType;
  title: string;
  description: string;
  cta: string;
  badge?: string;
  /** Bitmə vaxtı (UTC). Boşdursa geri sayım göstərilmir (istisna: id "3" üçün birinci yükdə 48 saat fallback yalnız runtime-da). */
  expiresAtIso?: string | null;
  color: string;
}

export interface PromoCampaign extends Omit<PromoCampaignStored, "expiresAtIso"> {
  expiresAt?: Date;
}

export const PROMO_COLOR_PRESETS: { value: string; label: string }[] = [
  { value: "from-[#D90429] to-[#EF476F]", label: "Qırmızı / çəhrayı" },
  { value: "from-[#16A34A] to-[#22C55E]", label: "Yaşıl" },
  { value: "from-[#F59E0B] to-[#FBBF24]", label: "Narıncı / sarı" },
  { value: "from-[#8B5CF6] to-[#A78BFA]", label: "Bənövşəyi" },
  { value: "from-[#0EA5E9] to-[#38BDF8]", label: "Mavi" },
  { value: "from-[#1F2937] to-[#4B5563]", label: "Boz / qrafit" },
];

export const DEFAULT_PROMO_CAMPAIGNS_STORED: PromoCampaignStored[] = [
  {
    id: "1",
    type: "first_order",
    title: "İlk Sifarişinə 10% Endirim",
    description: "İndi qeydiyyatdan keç, ilk sifarişində 10% endirim qazan",
    cta: "İstifadə Et",
    badge: "YENİ",
    expiresAtIso: null,
    color: "from-[#D90429] to-[#EF476F]",
  },
  {
    id: "2",
    type: "referral",
    title: "Dostunu Gətir, 25 AZN Bonus Qazan",
    description: "Hər dəvət etdiyin dost üçün 25 AZN bonus",
    cta: "Dəvət Et",
    badge: "POPULYAR",
    expiresAtIso: null,
    color: "from-[#16A34A] to-[#22C55E]",
  },
  {
    id: "3",
    type: "limited_time",
    title: "Pro Paket 1 Ay Pulsuz",
    description: "İlk 100 dekorçuya xüsusi təklif. Vaxt tükənir!",
    cta: "İndi Al",
    badge: "MƏHDUD",
    expiresAtIso: null,
    color: "from-[#F59E0B] to-[#FBBF24]",
  },
];

const PROMO_TYPES: PromoCampaignType[] = ["first_order", "referral", "limited_time", "seasonal"];

function isValidStored(row: unknown): row is PromoCampaignStored {
  if (!row || typeof row !== "object") return false;
  const r = row as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.type === "string" &&
    PROMO_TYPES.includes(r.type as PromoCampaignType) &&
    typeof r.title === "string" &&
    typeof r.description === "string" &&
    typeof r.cta === "string" &&
    typeof r.color === "string"
  );
}

/** Admin saxladıqdan sonra ISO tarix parse */
export function storedToRuntime(
  rows: PromoCampaignStored[],
  opts?: { rolling48hForSlide3?: boolean }
): PromoCampaign[] {
  const rolling = opts?.rolling48hForSlide3 ?? false;
  return rows.map((c) => {
    let expiresAt: Date | undefined;
    if (c.expiresAtIso) {
      const d = new Date(c.expiresAtIso);
      if (!Number.isNaN(d.getTime())) expiresAt = d;
    } else if (rolling && c.id === "3" && c.type === "limited_time") {
      expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    }
    const { expiresAtIso: _omit, ...rest } = c;
    return { ...rest, expiresAt };
  });
}

export function getStoredPromoCampaigns(): PromoCampaignStored[] | null {
  const raw = getFromStorage<unknown>(HOME_PROMO_BANNER_KEY, null);
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const cleaned = raw.filter(isValidStored);
  if (cleaned.length === 0) return null;
  return cleaned;
}

/** Ana səhifə: localStorage yoxdursa default + mövcud davranış üçün 3-cü slayda 48 saat */
export function getHomePromoCampaignsRuntime(): PromoCampaign[] {
  const stored = getStoredPromoCampaigns();
  const base = stored ?? DEFAULT_PROMO_CAMPAIGNS_STORED;
  const useRolling = stored == null;
  return storedToRuntime(base, { rolling48hForSlide3: useRolling });
}

/** Server + ilk client paint eyni olsun (localStorage yalnız mount-dan sonra oxunur). */
export const HYDRATION_PROMO_CAMPAIGNS: PromoCampaign[] = storedToRuntime(
  DEFAULT_PROMO_CAMPAIGNS_STORED,
  { rolling48hForSlide3: false }
);

export function saveHomePromoCampaigns(rows: PromoCampaignStored[]): void {
  saveToStorage(HOME_PROMO_BANNER_KEY, rows);
}

const PROXY_API_BASE = "/api/backend";
const DIRECT_API_BASE = `${getBackendOrigin()}/api`;

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("decor_current_user");
    if (raw) {
      const parsed = JSON.parse(raw) as { token?: string };
      if (parsed.token) return { Authorization: `Bearer ${parsed.token}` };
    }
    const sub = sessionStorage.getItem("premium_subadmin_jwt");
    if (sub) {
      const parsed = JSON.parse(sub) as { token?: string };
      if (parsed.token) return { Authorization: `Bearer ${parsed.token}` };
    }
  } catch {
    /* ignore */
  }
  return {};
}

function normalizeApiHomePromo(row: unknown): PromoCampaignStored | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const id = String(r.id ?? "").trim();
  const type = String(r.type ?? "").trim() as PromoCampaignType;
  const title = String(r.title ?? "").trim();
  const description = String(r.description ?? "").trim();
  const cta = String(r.cta ?? "").trim();
  const color = String(r.color ?? "").trim();
  if (!id || !PROMO_TYPES.includes(type) || !title || !cta || !color) return null;
  const badgeRaw = r.badge;
  const badge = typeof badgeRaw === "string" && badgeRaw.trim() ? badgeRaw.trim() : undefined;
  const exp = r.expiresAtIso;
  const expiresAtIso = typeof exp === "string" && exp.trim() ? exp.trim() : null;
  return { id, type, title, description, cta, badge, expiresAtIso, color };
}

/** İctimai GET — bütün ziyarətçilər; admin GET üçün `admin=true` */
export async function loadHomePromoBannerFromRemote(admin = false): Promise<PromoCampaignStored[]> {
  const fallback = () => {
    removeFromStorage(HOME_PROMO_BANNER_KEY);
    return DEFAULT_PROMO_CAMPAIGNS_STORED.map((r) => ({ ...r }));
  };

  try {
    const res = await fetch(`${PROXY_API_BASE}/home-promo${admin ? "/admin" : ""}`, {
      headers: admin ? authHeader() : undefined,
      cache: "no-store",
    });
    if (!res.ok) throw new Error("home-promo fetch failed");
    const data = (await res.json()) as unknown;
    const list = Array.isArray(data)
      ? (data.map(normalizeApiHomePromo).filter(Boolean) as PromoCampaignStored[])
      : [];
    if (list.length > 0) {
      saveHomePromoCampaigns(list);
      return list;
    }
    // Boş cavab: köhnə keşi saxlamayaq
    return fallback();
  } catch {
    return fallback();
  }
}

export async function saveHomePromoBannerRemote(rows: PromoCampaignStored[]): Promise<PromoCampaignStored[]> {
  const payload = rows.map((r, index) => ({
    id: r.id,
    type: r.type,
    title: r.title.trim(),
    description: r.description.trim(),
    cta: r.cta.trim(),
    badge: r.badge ?? null,
    expiresAtIso: r.expiresAtIso ?? null,
    color: r.color.trim(),
    sortOrder: index,
  }));

  const res = await fetch(`${DIRECT_API_BASE}/home-promo`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Promo saxlanmadı");
  }
  const data = (await res.json()) as unknown;
  const list = Array.isArray(data)
    ? (data.map(normalizeApiHomePromo).filter(Boolean) as PromoCampaignStored[])
    : [];
  if (list.length > 0) {
    saveHomePromoCampaigns(list);
    return list;
  }
  saveHomePromoCampaigns(rows);
  return rows;
}

export function resetHomePromoCampaigns(): PromoCampaignStored[] {
  removeFromStorage(HOME_PROMO_BANNER_KEY);
  return [...DEFAULT_PROMO_CAMPAIGNS_STORED];
}

export function runtimeToStored(rows: PromoCampaign[]): PromoCampaignStored[] {
  return rows.map((c) => ({
    id: c.id,
    type: c.type,
    title: c.title.trim(),
    description: c.description.trim(),
    cta: c.cta.trim(),
    badge: c.badge?.trim() || undefined,
    expiresAtIso: c.expiresAt && !Number.isNaN(c.expiresAt.getTime()) ? c.expiresAt.toISOString() : null,
    color: c.color,
  }));
}
