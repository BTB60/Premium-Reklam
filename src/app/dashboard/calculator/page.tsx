"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  auth,
  type User,
  type Product,
  loyaltyOverrideFromProfile,
  type LoyaltyPercentOverride,
} from "@/lib/db";
import { productApi, orderApi, authApi, type Product as ApiProduct } from "@/lib/authApi";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { PriceCalculator } from "@/components/user/PriceCalculator";
import { ArrowLeft, Calculator } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

function mapApiProductToCalculator(p: ApiProduct): Product {
  const raw = String(p.unit ?? "M2").toUpperCase();
  let unit: Product["unit"] = "ədəd";
  if (raw === "M2" || raw === "M²" || raw.includes("M2")) unit = "m²";
  else if (raw === "METER" || raw === "METR" || raw === "LINEARMETER") unit = "metr";

  return {
    id: String(p.id),
    name: p.name,
    description: p.description ?? "",
    category: p.category ?? "",
    basePrice: Number(p.salePrice) || 0,
    unit,
    minOrder: 1,
    isActive: String(p.status ?? "").toUpperCase() === "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function CalculatorPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [lifetimeOrderTotal, setLifetimeOrderTotal] = useState<number | undefined>(undefined);
  const [loyaltyOverride, setLoyaltyOverride] = useState<LoyaltyPercentOverride>(null);
  const [hasCustomUserPrices, setHasCustomUserPrices] = useState(false);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    void (async () => {
      try {
        const apiUser = authApi.getCurrentUser();
        const uid = apiUser ? Number(apiUser.userId) : NaN;
        const pricesPromise =
          Number.isFinite(uid) && uid > 0
            ? productApi.getUserPrices(uid).catch(() => [])
            : Promise.resolve([]);
        const [list, summary, profile, userPricesRows] = await Promise.all([
          productApi.getActiveCatalog(),
          orderApi.getMySummary().catch(() => null),
          authApi.getMyProfile().catch(() => null),
          pricesPromise,
        ]);
        setAvailableProducts(list.map(mapApiProductToCalculator));
        if (summary && Number.isFinite(Number(summary.monthOrderAmount))) {
          setLifetimeOrderTotal(Number(summary.monthOrderAmount));
        }
        setLoyaltyOverride(loyaltyOverrideFromProfile(profile as any));
        setHasCustomUserPrices(Array.isArray(userPricesRows) && userPricesRows.length > 0);
      } catch {
        setAvailableProducts([]);
        setHasCustomUserPrices(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D90429]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Header />

      <main className="pt-20 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-6"
          >
            <Link href="/dashboard">
              <Button variant="ghost" icon={<ArrowLeft className="w-5 h-5" />}>
                Geri
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-[#1F2937]">Qiymət Hesablayıcı</h1>
          </motion.div>

          <PriceCalculator
            availableProducts={availableProducts}
            user={user}
            lifetimeOrderTotalAzn={lifetimeOrderTotal}
            loyaltyPercentOverride={loyaltyOverride}
            hasCustomUserPrices={hasCustomUserPrices}
          />
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
