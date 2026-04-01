"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { type User, type BonusTransaction, bonus } from "@/lib/db";
import { Award, Gift, TrendingUp, Star, Crown, Diamond } from "lucide-react";

interface BonusDashboardProps {
  user: User;
  transactions: BonusTransaction[];
}

const TIERS = {
  bronze: { name: "Bronze", icon: Star, color: "text-amber-600", bgColor: "bg-amber-100", discount: 0 },
  silver: { name: "Silver", icon: Award, color: "text-gray-600", bgColor: "bg-gray-100", discount: 0.05 },
  gold: { name: "Gold", icon: Crown, color: "text-yellow-600", bgColor: "bg-yellow-100", discount: 0.10 },
  platinum: { name: "Platinum", icon: Diamond, color: "text-purple-600", bgColor: "bg-purple-100", discount: 0.15 },
};

const TIER_REQUIREMENTS = {
  bronze: 0,
  silver: 500,
  gold: 2000,
  platinum: 5000,
};

export function BonusDashboard({ user, transactions }: BonusDashboardProps) {
  const currentTier = TIERS[user.bonusTier];
  const TierIcon = currentTier.icon;

  const stats = useMemo(() => {
    const totalEarned = transactions
      .filter(t => t.type === "earned" || t.type === "bonus")
      .reduce((sum, t) => sum + t.points, 0);
    const totalSpent = transactions
      .filter(t => t.type === "spent")
      .reduce((sum, t) => sum + t.points, 0);
    
    return {
      balance: user.bonusPoints,
      totalEarned,
      totalSpent,
      nextTier: getNextTier(totalEarned),
      progress: getProgress(totalEarned),
    };
  }, [user, transactions]);

  function getNextTier(earned: number) {
    if (earned >= 5000) return null;
    if (earned >= 2000) return { name: "Platinum", required: 5000 };
    if (earned >= 500) return { name: "Gold", required: 2000 };
    return { name: "Silver", required: 500 };
  }

  function getProgress(earned: number) {
    if (earned >= 5000) return 100;
    if (earned >= 2000) return ((earned - 2000) / 3000) * 100;
    if (earned >= 500) return ((earned - 500) / 1500) * 100;
    return (earned / 500) * 100;
  }

  return (
    <div className="space-y-6">
      {/* Current Tier Card */}
      <Card className="p-6 bg-gradient-to-r from-[#D90429] to-[#EF476F] text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">Cari Səviyyə</p>
            <div className="flex items-center gap-2 mt-1">
              <TierIcon className="w-8 h-8" />
              <span className="text-3xl font-bold">{currentTier.name}</span>
            </div>
            <p className="text-white/80 text-sm mt-2">
              {(currentTier.discount * 100)}% endirim hüququ
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm">Bonus Balansı</p>
            <p className="text-4xl font-bold">{stats.balance}</p>
            <p className="text-white/80 text-sm">xal</p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-[#1F2937]">{stats.totalEarned}</p>
          <p className="text-xs text-gray-500">Qazanılan xal</p>
        </Card>

        <Card className="p-4 text-center">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Gift className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-[#1F2937]">{stats.totalSpent}</p>
          <p className="text-xs text-gray-500">Xərclənən xal</p>
        </Card>

        <Card className="p-4 text-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Award className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-[#1F2937]">{stats.balance}</p>
          <p className="text-xs text-gray-500">Mövcud balans</p>
        </Card>
      </div>

      {/* Progress to Next Tier */}
      {stats.nextTier && (
        <Card className="p-6">
          <h3 className="font-bold text-[#1F2937] mb-4">
            Növbəti səviyyəyə: {stats.nextTier.name}
          </h3>
          <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-[#D90429] rounded-full transition-all"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {stats.totalEarned} / {stats.nextTier.required} xal
          </p>
        </Card>
      )}

      {/* Tier Benefits */}
      <Card className="p-6">
        <h3 className="font-bold text-[#1F2937] mb-4">Səviyyə üstünlükləri</h3>
        <div className="space-y-3">
          {Object.entries(TIERS).map(([key, tier]) => {
            const Icon = tier.icon;
            const isCurrent = key === user.bonusTier;
            return (
              <div
                key={key}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isCurrent ? "bg-[#D90429]/10 border border-[#D90429]" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${tier.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${tier.color}`} />
                  </div>
                  <div>
                    <p className={`font-medium ${isCurrent ? "text-[#D90429]" : ""}`}>
                      {tier.name}
                      {isCurrent && " (Cari)"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {TIER_REQUIREMENTS[key as keyof typeof TIER_REQUIREMENTS]}+ xal
                    </p>
                  </div>
                </div>
                <span className="font-bold text-[#1F2937]">
                  {(tier.discount * 100)}% endirim
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Transaction History */}
      <Card className="p-6">
        <h3 className="font-bold text-[#1F2937] mb-4">Xal tarixçəsi</h3>
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Hələ xal əməliyyatı yoxdur</p>
          ) : (
            transactions.slice().reverse().map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">{t.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(t.createdAt).toLocaleDateString("az-AZ")}
                  </p>
                </div>
                <span
                  className={`font-bold ${
                    t.type === "earned" || t.type === "bonus"
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {t.type === "earned" || t.type === "bonus" ? "+" : "-"}
                  {t.points}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
