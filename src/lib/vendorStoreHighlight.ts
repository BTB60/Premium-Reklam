import type { VendorHighlightTier, VendorStore } from "./db/types";

export function normalizeHighlightTier(
  raw: VendorHighlightTier | string | undefined | null
): VendorHighlightTier {
  const x = String(raw || "").toLowerCase();
  if (x === "vip") return "vip";
  if (x === "premium") return "premium";
  return "standard";
}

export function vendorHighlightRank(tier: VendorHighlightTier | undefined): number {
  const t = normalizeHighlightTier(tier);
  if (t === "vip") return 3;
  if (t === "premium") return 2;
  return 1;
}

/** VIP təyin olunub, bitmə tarixi var və artıq keçib (yeniləmə üçün). */
export function isTimedVipExpired(store: VendorStore): boolean {
  if (normalizeHighlightTier(store.highlightTier) !== "vip") return false;
  const exp = store.vipExpiresAt;
  if (exp == null || String(exp).trim() === "") return false;
  return new Date(exp).getTime() < Date.now();
}

/**
 * Sıralama və nişan üçün effektiv paket (müddəti bitmiş VIP → tierAfterVip / standart).
 * Storage hələ köhnədirsə, bir oxu dövründə vendorStores reconcile edəcək.
 */
export function getEffectiveHighlightTier(store: VendorStore): VendorHighlightTier {
  if (isTimedVipExpired(store)) {
    return normalizeHighlightTier(store.tierAfterVip ?? "standard");
  }
  return normalizeHighlightTier(store.highlightTier);
}

export function vendorHighlightRankForStore(store: VendorStore): number {
  return vendorHighlightRank(getEffectiveHighlightTier(store));
}

/** Marketplace: yüksək paket əvvəl, sonra ada görə. */
export function compareVendorStoresByHighlight(a: VendorStore, b: VendorStore): number {
  const diff = vendorHighlightRankForStore(a) - vendorHighlightRankForStore(b);
  if (diff !== 0) return -diff;
  return a.name.localeCompare(b.name, "az");
}

/** VIP aktiv və müddətlidirsə bitmə tarixi (göstərim üçün). */
export function getVipExpiryDisplay(store: VendorStore): string | null {
  if (getEffectiveHighlightTier(store) !== "vip") return null;
  const exp = store.vipExpiresAt;
  if (exp == null || String(exp).trim() === "") return null;
  try {
    return new Date(exp).toLocaleDateString("az-AZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export function highlightTierLabel(tier: VendorHighlightTier): string {
  switch (normalizeHighlightTier(tier)) {
    case "vip":
      return "VIP";
    case "premium":
      return "Premium";
    default:
      return "Standart";
  }
}

export function highlightTierBadgeClass(tier: VendorHighlightTier): string {
  switch (normalizeHighlightTier(tier)) {
    case "vip":
      return "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm";
    case "premium":
      return "bg-gradient-to-r from-[#D90429] to-rose-600 text-white shadow-sm";
    default:
      return "bg-gray-100 text-gray-600";
  }
}
