/**
 * Mağaza kateqoriyaları: fəaliyyət növü (ayrıca) + material/məhsul tipli köhnə teqlər.
 * Köhnə teqlər silinmir — yalnız seçim siyahısı və təkrarların təmizlənməsi.
 */

/** Dekorçu və Reklamçı — ayrıca seçimlər */
export const VENDOR_STORE_PROFILE_CATEGORY_OPTIONS = ["Dekorçu", "Reklamçı"] as const;

/** Köhnə mağaza/məhsul tipli kateqoriyalar */
export const VENDOR_STORE_LEGACY_CATEGORY_OPTIONS = [
  "Vinil Banner",
  "Orakal",
  "Laminasiya",
  "Karton",
  "Plexi",
  "Dizayn",
  "UV Çap",
  "Loqotip",
  "Banner",
  "İşıqlı Qutu",
] as const;

export function getVendorStoreCategoryOptions(): string[] {
  return [...VENDOR_STORE_PROFILE_CATEGORY_OPTIONS, ...VENDOR_STORE_LEGACY_CATEGORY_OPTIONS];
}

/** Köhnə və ya istənilən teqləri saxlayır; yalnız təkrarları və boşları çıxarır. */
export function normalizeVendorStoreCategories(cats: string[] | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of cats || []) {
    const t = typeof c === "string" ? c.trim() : "";
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}
