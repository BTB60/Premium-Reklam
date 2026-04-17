import { MonthlyStats } from "./types";

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

export function calculateDiscount(monthlySpent: number): { rate: number; tier: MonthlyStats["discountTier"] } {
  if (monthlySpent >= 1000) return { rate: 0.10, tier: "10percent" };
  if (monthlySpent >= 500) return { rate: 0.05, tier: "5percent" };
  return { rate: 0, tier: "none" };
}

export function getDiscountMessage(tier: MonthlyStats["discountTier"]): string {
  switch (tier) {
    case "10percent": return "🎉 Bu ay 1000+ AZN sifariş etdiyiniz üçün 10% endirim qazandınız!";
    case "5percent": return "⭐ Bu ay 500+ AZN sifariş etdiyiniz üçün 5% endirim qazandınız!";
    default: return "💡 500 AZN sifariş edin 5%, 1000 AZN edin 10% endirim qazanın!";
  }
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
  if (typeof window === "undefined") return;
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.error("Failed to play notification sound:", e);
  }
}