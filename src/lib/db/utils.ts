import { MonthlyStats } from "./types";
import { playPremiumNotificationSound } from "@/lib/notificationSound";
import { settings } from "./business";

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getUserMonthlyStats(user: { monthlyStats?: MonthlyStats[] }): MonthlyStats {
  const currentMonth = getCurrentMonth();
  if (!user.monthlyStats) user.monthlyStats = [];
  let stats = user.monthlyStats.find(s => s.month === currentMonth);
  if (!stats) {
    stats = { month: currentMonth, totalSpent: 0, orderCount: 0, discountTier: "none" };
    user.monthlyStats.push(stats);
  }
  return stats;
}

/** Cari təqvim ayı üzrə sifariş məbləği həddi (ay dəyişəndə sıfırlanır) — faizlər: `settings.monthlyBonus500` və ya müştəri üzrə backend */
export const LOYALTY_FIRST_THRESHOLD_AZN = 500;
/** İkinci hədd — eyni aylıq dövr üçün */
export const LOYALTY_SECOND_THRESHOLD_AZN = 1000;

/** `first`/`second`: null = həmin hədd üçün ümumi (local settings) faizindən istifadə */
export type LoyaltyPercentOverride = { first: number | null; second: number | null } | null;

/** Müştəri üzrə xüsusi qiymət təyin olunubsa bonus endirimi tətbiq olunmur. */
export type LoyaltyEligibilityOptions = {
  hasCustomUserPrices?: boolean;
};

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/** Admin panelində bonus proqramı söndürülübsə false. */
export function isLoyaltyBonusProgramEnabled(): boolean {
  return settings.get().loyaltyBonusEnabled !== false;
}

export function loyaltyOverrideFromProfile(profile: {
  bonusLoyalty500Percent?: number | null;
  bonusLoyalty1000Percent?: number | null;
} | null | undefined): LoyaltyPercentOverride {
  if (!profile) return null;
  const f = profile.bonusLoyalty500Percent;
  const s = profile.bonusLoyalty1000Percent;
  if (f == null && s == null) return null;
  return { first: f ?? null, second: s ?? null };
}

export function getLoyaltyPercentages(override?: LoyaltyPercentOverride): { first: number; second: number } {
  const s = settings.get();
  const defFirst = clampPct(Number(s.monthlyBonus500) || 5);
  const defSecond = clampPct(Number(s.monthlyBonus1000) || 10);
  if (!override) return { first: defFirst, second: defSecond };
  return {
    first: override.first != null ? clampPct(Number(override.first)) : defFirst,
    second: override.second != null ? clampPct(Number(override.second)) : defSecond,
  };
}

/**
 * Cari ay üzrə sifariş məbləyi: hədd keçəndə növbəti sifarişlərə endirim faizi.
 * Ayın sonunda məbləğ sıfırlanır (yeni ayda yenidən hesablanır).
 */
export function calculateDiscount(
  monthSpentAzn: number,
  override?: LoyaltyPercentOverride,
  eligibility?: LoyaltyEligibilityOptions
): { rate: number; tier: MonthlyStats["discountTier"]; activePercent: number } {
  if (!isLoyaltyBonusProgramEnabled()) {
    return { rate: 0, tier: "none", activePercent: 0 };
  }
  if (eligibility?.hasCustomUserPrices) {
    return { rate: 0, tier: "none", activePercent: 0 };
  }
  const { first, second } = getLoyaltyPercentages(override);
  if (monthSpentAzn >= LOYALTY_SECOND_THRESHOLD_AZN) {
    return { rate: second / 100, tier: "10percent", activePercent: second };
  }
  if (monthSpentAzn >= LOYALTY_FIRST_THRESHOLD_AZN) {
    return { rate: first / 100, tier: "5percent", activePercent: first };
  }
  return { rate: 0, tier: "none", activePercent: 0 };
}

export function getDiscountMessage(
  tier: MonthlyStats["discountTier"],
  override?: LoyaltyPercentOverride,
  eligibility?: LoyaltyEligibilityOptions
): string {
  if (!isLoyaltyBonusProgramEnabled()) {
    return "Bonus endirim proqramı hazırda deaktivdir. Aktiv etmək üçün admin panelində Sistem ayarlarına baxın.";
  }
  if (eligibility?.hasCustomUserPrices) {
    return "Sizə müştəri üzrə xüsusi qiymət təyin olunub — bonus endirim proqramı bu halda tətbiq olunmur.";
  }
  const { first, second } = getLoyaltyPercentages(override);
  const t1 = LOYALTY_FIRST_THRESHOLD_AZN;
  const t2 = LOYALTY_SECOND_THRESHOLD_AZN;
  switch (tier) {
    case "10percent":
      return `🎉 Bu ay ${t2}+ AZN sifarişə çatdınız — növbəti sifarişlərdə ${second}% bonus endirim tətbiq olunur (ay sonunda sıfırlanır).`;
    case "5percent":
      return `⭐ Bu ay ${t1}+ AZN sifarişə çatdınız — ${first}% bonus endirim. ${second}% üçün bu aykı məbləği ${t2} AZN-ə çatdırın.`;
    default:
      return `💡 Bonus (cari ay): ${t1} AZN — ${first}%; ${t2} AZN — ${second}%. Ay bitəndə məbləğ sıfırlanır, yenidən hesablanır.`;
  }
}

/** Dashboard / kalkulyator üçün növbəti həddə qədər progress (cari ay üzrə məbləğ). */
export function getLoyaltyBonusProgress(
  monthSpentAzn: number,
  override?: LoyaltyPercentOverride,
  eligibility?: LoyaltyEligibilityOptions
): {
  spent: number;
  tier: MonthlyStats["discountTier"];
  activePercent: number;
  nextThresholdAzn: number | null;
  nextPercent: number | null;
  progressPercent: number;
  hint: string;
} {
  const spent = Math.max(0, monthSpentAzn);
  if (!isLoyaltyBonusProgramEnabled()) {
    return {
      spent,
      tier: "none",
      activePercent: 0,
      nextThresholdAzn: null,
      nextPercent: null,
      progressPercent: 0,
      hint: "Bonus proqramı admin tərəfindən söndürülüb. İstədiyiniz vaxt yenidən aktiv edə bilərsiniz.",
    };
  }
  if (eligibility?.hasCustomUserPrices) {
    return {
      spent,
      tier: "none",
      activePercent: 0,
      nextThresholdAzn: null,
      nextPercent: null,
      progressPercent: 0,
      hint: "Müştəri üzrə xüsusi qiymət təyin olunduğu üçün bonus endirim hesablanmır.",
    };
  }
  const t1 = LOYALTY_FIRST_THRESHOLD_AZN;
  const t2 = LOYALTY_SECOND_THRESHOLD_AZN;
  const { first, second } = getLoyaltyPercentages(override);
  const disc = calculateDiscount(monthSpentAzn, override, eligibility);

  if (spent >= t2) {
    return {
      spent,
      tier: disc.tier,
      activePercent: disc.activePercent,
      nextThresholdAzn: null,
      nextPercent: null,
      progressPercent: 100,
      hint: `Bu ay üçün maksimum bonus aktivdir: ${second}% növbəti sifarişlərdə (yeni ayda sıfırlanır).`,
    };
  }
  if (spent >= t1) {
    const span = t2 - t1;
    const inSeg = span > 0 ? ((spent - t1) / span) * 100 : 100;
    const remain = Math.max(0, t2 - spent);
    return {
      spent,
      tier: disc.tier,
      activePercent: disc.activePercent,
      nextThresholdAzn: t2,
      nextPercent: second,
      progressPercent: Math.min(100, Math.max(0, inSeg)),
      hint: `${first}% bonus aktivdir. ${second}% üçün bu aykı sifarişə daha ${remain.toFixed(0)} AZN lazımdır.`,
    };
  }
  const inSeg = t1 > 0 ? (spent / t1) * 100 : 0;
  const remain = Math.max(0, t1 - spent);
  return {
    spent,
    tier: "none",
    activePercent: 0,
    nextThresholdAzn: t1,
    nextPercent: first,
    progressPercent: Math.min(100, Math.max(0, inSeg)),
    hint: `Bu ay ${first}% bonus üçün ${remain.toFixed(0)} AZN çatışmır (həd: ${t1} AZN).`,
  };
}

export function calculateLevelFromXP(xp: number): number {
  const levels = [
    { level: 100, xp: 1500 }, { level: 75, xp: 1000 }, { level: 50, xp: 600 },
    { level: 25, xp: 300 }, { level: 10, xp: 100 }, { level: 1, xp: 0 },
  ];
  for (const l of levels) if (xp >= l.xp) return l.level;
  return 1;
}

export function playNotificationSound() {
  playPremiumNotificationSound();
}