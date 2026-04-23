/**
 * Mağaza kateqoriyaları: fəaliyyət növü (ayrıca) + material/məhsul tipli köhnə teqlər.
 * Köhnə teqlər silinmir — yalnız seçim siyahısı və təkrarların təmizlənməsi.
 */

import { getFromStorage, saveToStorage } from "@/lib/db/storage";

/** Dekorçu və Reklamçı — ayrıca seçimlər */
export const VENDOR_STORE_PROFILE_CATEGORY_OPTIONS = ["Dekorçu", "Reklamçı"] as const;

/** Mağaza + məhsul + marketplace üçün ümumi material/məhsul tipli kateqoriyalar */
export const VENDOR_STORE_LEGACY_CATEGORY_OPTIONS = [
  "Dekorlar",
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

const CUSTOM_PRODUCT_CATEGORIES_KEY = "decor_custom_product_categories";

export const MARKETPLACE_PRODUCT_CATEGORIES_EVENT = "premium:marketplace-product-categories";

/** Satıcı yazdığı yeni məhsul kateqoriyaları (Marketplace filtrində də görünür). */
export function getRegisteredCustomProductCategories(): string[] {
  return normalizeVendorStoreCategories(
    getFromStorage<string[]>(CUSTOM_PRODUCT_CATEGORIES_KEY, [])
  );
}

/** Məhsul üçün yazılan yeni adı qeyd edir (ümumi siyahıda olmayıbsa). */
export function registerProductCategory(raw: string): string {
  const t = typeof raw === "string" ? raw.trim() : "";
  if (!t || typeof window === "undefined") return t;
  const legacySet = new Set<string>([...VENDOR_STORE_LEGACY_CATEGORY_OPTIONS]);
  const existing = getRegisteredCustomProductCategories();
  if (!legacySet.has(t) && !existing.includes(t)) {
    saveToStorage(
      CUSTOM_PRODUCT_CATEGORIES_KEY,
      normalizeVendorStoreCategories([...existing, t])
    );
  }
  window.dispatchEvent(new CustomEvent(MARKETPLACE_PRODUCT_CATEGORIES_EVENT));
  return t;
}

/** Məhsul formu: ümumi siyahı + mağaza teqləri (Dekorçu/Reklamçı çıxarılır) + istifadəçi kateqoriyaları. */
export function getVendorProductCategoryPickerOptions(store: { category?: string[] } | null): string[] {
  const profile = new Set<string>([...VENDOR_STORE_PROFILE_CATEGORY_OPTIONS]);
  const fromStore = normalizeVendorStoreCategories(store?.category).filter((c) => !profile.has(c));
  const base = [...VENDOR_STORE_LEGACY_CATEGORY_OPTIONS];
  const custom = getRegisteredCustomProductCategories();
  return normalizeVendorStoreCategories([...base, ...fromStore, ...custom]);
}

/** Marketplace məhsul filtri: baza + satıcı kateqoriyaları + aktiv mağaza teqləri + məhsul kateqoriyaları. */
export function getMarketplaceProductFilterCategories(
  products: { category: string }[],
  stores?: { category?: string[]; isActive?: boolean; isApproved?: boolean }[]
): string[] {
  const set = new Set<string>();
  for (const c of VENDOR_STORE_LEGACY_CATEGORY_OPTIONS) set.add(c);
  for (const c of getRegisteredCustomProductCategories()) set.add(c);
  const profile = new Set<string>([...VENDOR_STORE_PROFILE_CATEGORY_OPTIONS]);
  for (const s of stores || []) {
    if (s.isActive === false || s.isApproved === false) continue;
    for (const c of normalizeVendorStoreCategories(s.category)) {
      if (!profile.has(c)) set.add(c);
    }
  }
  for (const p of products) {
    const t = typeof p.category === "string" ? p.category.trim() : "";
    if (t) set.add(t);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "az"));
}

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
