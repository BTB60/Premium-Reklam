"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { authApi, orderApi, type UserData, type Order } from "@/lib/authApi";
import { getOrderTotal } from "@/lib/orderHelpers";
import { motion } from "framer-motion";
import {
  Trophy,
  Star,
  TrendingUp,
  Gift,
  Lock,
  CheckCircle,
  Zap,
  Award,
  Crown,
  Target,
} from "lucide-react";
import Link from "next/link";

// Level thresholds and benefits
const LEVEL_CONFIG = {
  1: { xp: 0, title: "Yeni Başlayan", benefits: ["Borc limiti: 0 AZN"], icon: Star },
  10: { xp: 100, title: "Tələbə", benefits: ["Borc limiti: 50 AZN"], icon: Star },
  25: { xp: 300, title: "Təcrübəçi", benefits: ["Borc limiti: 100 AZN", "5% bonus"], icon: Zap },
  50: { xp: 600, title: "Usta", benefits: ["Borc limiti: 200 AZN", "10% bonus"], icon: Award },
  75: { xp: 1000, title: "Ekspert", benefits: ["Borc limiti: 300 AZN", "15% bonus"], icon: Trophy },
  100: { xp: 1500, title: "Master", benefits: ["Borc limiti: 500 AZN", "20% bonus", "Premium dəstək"], icon: Crown },
};

function calculateLevelFromXP(xp: number): number {
  const levels = Object.keys(LEVEL_CONFIG).map(Number).sort((a, b) => b - a);
  for (const level of levels) {
    if (xp >= LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG].xp) {
      return level;
    }
  }
  return 1;
}

function calculateXPFromOrders(userOrders: Order[]): number {
  // XP = 1 point per 1 AZN spent
  return userOrders.reduce((sum, order) => sum + Math.floor(getOrderTotal(order)), 0);
}

function getNextLevel(currentLevel: number): number | null {
  const levels = Object.keys(LEVEL_CONFIG).map(Number).sort((a, b) => a - b);
  const nextLevel = levels.find(l => l > currentLevel);
  return nextLevel || null;
}

export default function LevelPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);

    orderApi
      .getMyOrders()
      .then((data) => {
        setUserOrders(data.orders || []);
      })
      .catch((error) => {
        console.error("[Level] load orders error:", error);
        setUserOrders([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D90429]" />
      </div>
    );
  }

  if (!user) return null;

  const totalXP = calculateXPFromOrders(userOrders);
  const calculatedLevel = calculateLevelFromXP(totalXP);
  const nextLevel = getNextLevel(calculatedLevel);
  const currentLevelConfig = LEVEL_CONFIG[calculatedLevel as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG[1];
  const nextLevelConfig = nextLevel ? LEVEL_CONFIG[nextLevel as keyof typeof LEVEL_CONFIG] : null;

  const xpProgress = nextLevelConfig
    ? ((totalXP - currentLevelConfig.xp) / (nextLevelConfig.xp - currentLevelConfig.xp)) * 100
    : 100;

  const Icon = currentLevelConfig.icon;

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Header />

      <main className="pt-20 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl font-bold text-[#1F2937]">Səviyyə Sistemi</h1>
            <p className="text-[#6B7280] mt-1">Sifariş et, XP qazan, səviyyəni artır</p>
          </motion.div>

          {/* Current Level Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 mb-6 bg-gradient-to-r from-[#D90429] to-[#EF476F] text-white">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Icon className="w-10 h-10" />
                </div>
                <div className="flex-1">
                  <p className="text-white/80 text-sm">Hazırkı Səviyyə</p>
                  <h2 className="text-3xl font-bold">Level {calculatedLevel}</h2>
                  <p className="text-white/90">{currentLevelConfig.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm">Ümumi XP</p>
                  <p className="text-2xl font-bold">{totalXP}</p>
                </div>
              </div>

              {/* Progress to Next Level */}
              {nextLevel && nextLevelConfig && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Level {calculatedLevel}</span>
                    <span>Level {nextLevel}</span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                  <p className="text-center text-sm mt-2 text-white/80">
                    {nextLevelConfig.xp - totalXP} XP qaldı Level {nextLevel}-ə çatmaq üçün
                  </p>
                </div>
              )}

              {!nextLevel && (
                <div className="mt-6 text-center">
                  <Crown className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-medium">Maksimum səviyyəyə çatdınız! 🎉</p>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 text-center">
              <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#1F2937]">{calculatedLevel}</p>
              <p className="text-xs text-[#6B7280]">Səviyyə</p>
            </Card>
            <Card className="p-4 text-center">
              <Target className="w-8 h-8 text-[#D90429] mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#1F2937]">{totalXP}</p>
              <p className="text-xs text-[#6B7280]">Ümumi XP</p>
            </Card>
            <Card className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#1F2937]">{userOrders.length}</p>
              <p className="text-xs text-[#6B7280]">Sifariş</p>
            </Card>
            <Card className="p-4 text-center">
              <Gift className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#1F2937]">{(user as any).bonusPoints || 0}</p>
              <p className="text-xs text-[#6B7280]">Bonus Xal</p>
            </Card>
          </div>

          {/* Level Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 mb-6">
              <h3 className="font-semibold text-[#1F2937] mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Hazırkı Səviyyənin Faydaları
              </h3>
              <div className="space-y-3">
                {currentLevelConfig.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-[#1F2937]">{benefit}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* All Levels */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <h3 className="font-semibold text-[#1F2937] mb-4">Bütün Səviyyələr</h3>
              <div className="space-y-4">
                {Object.entries(LEVEL_CONFIG)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([level, config]) => {
                    const isUnlocked = Number(level) <= calculatedLevel;
                    const isCurrent = Number(level) === calculatedLevel;
                    const LevelIcon = config.icon;

                    return (
                      <div
                        key={level}
                        className={`flex items-center gap-4 p-4 rounded-xl ${
                          isCurrent
                            ? "bg-[#D90429]/10 border-2 border-[#D90429]"
                            : isUnlocked
                            ? "bg-gray-50"
                            : "bg-gray-50 opacity-60"
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isUnlocked ? "bg-[#D90429] text-white" : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          {isUnlocked ? (
                            <LevelIcon className="w-6 h-6" />
                          ) : (
                            <Lock className="w-6 h-6" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[#1F2937]">Level {level}</p>
                            {isCurrent && (
                              <span className="px-2 py-0.5 bg-[#D90429] text-white text-xs rounded-full">
                                Hazırda
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[#6B7280]">{config.title}</p>
                          <p className="text-xs text-[#6B7280]">{config.xp} XP tələb olunur</p>
                        </div>
                        <div className="text-right">
                          {config.benefits.map((benefit, i) => (
                            <p key={i} className="text-xs text-[#6B7280]">
                              {benefit}
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>
          </motion.div>

          {/* CTA */}
          <div className="mt-6 text-center">
            <Link href="/orders/new">
              <Button icon={<TrendingUp className="w-5 h-5" />}>
                Sifariş Et, XP Qazan
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
