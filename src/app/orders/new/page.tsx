"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Ruler,
  CreditCard,
  AlertTriangle,
  Phone,
  FileText,
  Calculator,
  Package,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getUserMonthlyStats,
  calculateDiscount,
  getDiscountMessage,
  loyaltyOverrideFromProfile,
  type LoyaltyPercentOverride,
  type User,
} from "@/lib/db";
import { authApi, orderApi, productApi, type UserData } from "@/lib/authApi";
import { playPremiumNotificationSound } from "@/lib/notificationSound";

interface SizeItem {
  id: string;
  width: number;
  height: number;
  area: number;
  basePrice: number;
  finalPrice: number;
}

interface OrderItem {
  id: string;
  productName: string;
  unitPrice: number;
  sizes: SizeItem[];
}

type CatalogRow = { id: string; name: string; unitPrice: number };

export default function NewOrderPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Discount state
  const [monthlyStats, setMonthlyStats] = useState({ 
    totalSpent: 0, 
    discountTier: "none" as "none" | "5percent" | "10percent", 
    discountRate: 0 
  });
  
  // Form state — məhsullar yalnız backend kataloqundan (admin)
  const [catalog, setCatalog] = useState<CatalogRow[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<CatalogRow | null>(null);
  const [sizes, setSizes] = useState<SizeItem[]>([
    { id: "1", width: 1.8, height: 1.8, area: 3.24, basePrice: 16.2, finalPrice: 16.2 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "debt">("cash");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");
  /** Cari ayda (təqvim ayı) əvvəlki sifarişlərin cəmi — bonus həddi üçün; ay sonunda sıfırlanır. */
  const [priorOrderTotal, setPriorOrderTotal] = useState(0);
  /** Backend-dən müştəri üzrə bonus faizləri; null = yalnız ümumi (local) ayarlar. */
  const [loyaltyPercentOverride, setLoyaltyPercentOverride] = useState<LoyaltyPercentOverride>(null);
  /** Admin müştəri üzrə xüsusi qiymət təyin edibsə bonus hesablanmır. */
  const [hasCustomUserPrices, setHasCustomUserPrices] = useState(false);
  /** Yalnız productId uyğun gələndə tətbiq olunur (məhsul dəyişəndə köhnə qiymət qalmır). */
  const [priceResolution, setPriceResolution] = useState<{ productId: string; price: number } | null>(null);

  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    setCustomerPhone(currentUser.phone || "");

    void (async () => {
      try {
        const uid = Number(currentUser.userId);
        const pricesPromise =
          Number.isFinite(uid) && uid > 0
            ? productApi.getUserPrices(uid).catch(() => [])
            : Promise.resolve([]);
        const [summary, plist, profile, userPricesRows] = await Promise.all([
          orderApi.getMySummary(),
          productApi.getActiveCatalog(),
          authApi.getMyProfile().catch(() => null),
          pricesPromise,
        ]);
        const customPricingActive = Array.isArray(userPricesRows) && userPricesRows.length > 0;
        setHasCustomUserPrices(customPricingActive);
        const totalSpent = Number(summary.monthOrderAmount || 0);
        setPriorOrderTotal(totalSpent);
        const loyOverride = loyaltyOverrideFromProfile(profile);
        setLoyaltyPercentOverride(loyOverride);
        const discount = calculateDiscount(totalSpent, loyOverride, {
          hasCustomUserPrices: customPricingActive,
        });
        setMonthlyStats({
          totalSpent,
          discountTier: discount.tier,
          discountRate: discount.rate,
        });
        const rows: CatalogRow[] = plist.map((p) => ({
          id: String(p.id),
          name: p.name,
          unitPrice: Number(p.salePrice) || 0,
        }));
        setCatalog(rows);
        if (rows.length > 0) {
          const first = rows[0];
          setSelectedProduct(first);
          setSizes((prev) =>
            prev.map((s) => ({
              ...s,
              basePrice: s.area * first.unitPrice,
              finalPrice: s.area * first.unitPrice,
            })),
          );
        }
      } catch {
        setPriorOrderTotal(0);
        setLoyaltyPercentOverride(null);
        setHasCustomUserPrices(false);
        setMonthlyStats({
          totalSpent: 0,
          discountTier: "none",
          discountRate: 0,
        });
        setCatalog([]);
        setSelectedProduct(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const effectiveUnitPrice =
    selectedProduct != null
      ? priceResolution?.productId === selectedProduct.id
        ? priceResolution.price
        : selectedProduct.unitPrice
      : 0;

  useEffect(() => {
    if (!user || !selectedProduct) {
      setPriceResolution(null);
      return;
    }
    const uid = Number(user.userId);
    const pid = Number(selectedProduct.id);
    const sid = selectedProduct.id;
    if (!Number.isFinite(uid) || !Number.isFinite(pid)) {
      setPriceResolution(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const fromApi = await productApi.getUserPrice(uid, pid);
        if (cancelled) return;
        if (fromApi != null) setPriceResolution({ productId: sid, price: fromApi });
        else setPriceResolution(null);
      } catch {
        if (!cancelled) setPriceResolution(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, selectedProduct?.id]);

  useEffect(() => {
    if (!selectedProduct) return;
    const up = effectiveUnitPrice;
    setSizes((prev) =>
      prev.map((s) => ({
        ...s,
        basePrice: s.area * up,
        finalPrice: s.area * up,
      })),
    );
  }, [effectiveUnitPrice, selectedProduct?.id]);

  const calculateArea = (width: number, height: number) => {
    return width * height;
  };

  const calculatePrice = (area: number) => {
    return area * effectiveUnitPrice;
  };

  const updateSize = (id: string, field: "width" | "height", value: number) => {
    setSizes(sizes.map(size => {
      if (size.id !== id) return size;
      
      const newSize = { ...size, [field]: value };
      if (field === "width" || field === "height") {
        newSize.area = calculateArea(newSize.width, newSize.height);
        newSize.basePrice = calculatePrice(newSize.area);
        newSize.finalPrice = newSize.basePrice;
      }
      return newSize;
    }));
  };

  const addSize = () => {
    if (!selectedProduct) return;
    const up = effectiveUnitPrice;
    const newSize: SizeItem = {
      id: Date.now().toString(),
      width: 1,
      height: 1,
      area: 1,
      basePrice: up,
      finalPrice: up,
    };
    setSizes([...sizes, newSize]);
  };

  const removeSize = (id: string) => {
    if (sizes.length > 1) {
      setSizes(sizes.filter(s => s.id !== id));
    }
  };

  const baseTotals = {
    totalArea: sizes.reduce((sum, s) => sum + s.area, 0),
    totalBase: sizes.reduce((sum, s) => sum + s.basePrice, 0),
  };
  
  // Cari ay üzrə məbləğ (əvvəlki sifarişlər bu ay + hazırkı səbət) — ay dəyişəndə sıfırlanır
  const monthlyTotalForBonus = priorOrderTotal + baseTotals.totalBase;
  const loyaltyEligibility = { hasCustomUserPrices };
  const loyaltyDiscount = calculateDiscount(monthlyTotalForBonus, loyaltyPercentOverride, loyaltyEligibility);
  const discountRate = loyaltyDiscount.rate; // 0, 0.05, or 0.10
  
  // Apply discount to EACH size individually, then sum up
  const sizesWithDiscount = sizes.map(size => ({
    ...size,
    discountedPrice: size.basePrice * (1 - discountRate)
  }));
  
  const totalAfterDiscounts = sizesWithDiscount.reduce((sum, s) => sum + s.discountedPrice, 0);
  const totalDiscountAmount = baseTotals.totalBase - totalAfterDiscounts;
  
  const totals = {
    ...baseTotals,
    sizesWithDiscount,
    totalDiscount: totalDiscountAmount,
    finalAmount: totalAfterDiscounts,
    lifetimeTotal: monthlyTotalForBonus,
    discountRate: discountRate,
    discountTier: loyaltyDiscount.tier
  };

  const canUseDebt = Boolean(user && user.role === "ADMIN");

  const handleSubmit = async () => {
    if (!user || !selectedProduct) return;

    setSubmitting(true);

    try {
      const orderItems = sizes.map((size) => ({
        productId: Number(selectedProduct.id),
        productName: selectedProduct.name,
        unit: "M2",
        width: size.width,
        height: size.height,
        area: size.area,
        quantity: 1,
        unitPrice: effectiveUnitPrice,
        lineTotal: size.basePrice * (1 - totals.discountRate),
      }));

      await orderApi.create({
        userId: user.userId,
        customerName: user.fullName,
        customerPhone: customerPhone || undefined,
        customerWhatsapp: customerPhone || undefined,
        items: orderItems,
        paymentMethod: paymentMethod.toUpperCase(),
        isCredit: paymentMethod === "debt",
        note: note || undefined,
        discountPercent: Math.round(totals.discountRate * 10000) / 100,
        subtotal: totals.totalBase,
        discountAmount: totals.totalDiscount,
        totalAmount: totals.finalAmount,
        paidAmount: 0,
      });

      playPremiumNotificationSound();
      router.push("/dashboard?orderSuccess=true");
    } catch (error: any) {
      console.error("[Orders/New] Create order error:", error);
      alert(error?.message || "Sifariş yaradılmadı");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D90429]" />
      </div>
    );
  }

  if (!user) return null;

  if (!loading && catalog.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <Header />
        <main className="pt-20 pb-24 lg:pb-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 mb-8"
            >
              <Link href="/dashboard">
                <Button variant="ghost" icon={<ArrowLeft className="w-5 h-5" />}>
                  Geri
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-[#1F2937]">Yeni sifariş</h1>
            </motion.div>
            <Card className="p-8 text-center text-[#6B7280]">
              Kataloqda məhsul yoxdur. Yalnız admin paneldə əlavə olunan məhsullar göstərilir; məhsul
              əlavə edildikdən sonra sifariş verə bilərsiniz.
            </Card>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  if (!selectedProduct) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Header />
      
      <main className="pt-20 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <Link href="/dashboard">
              <Button variant="ghost" icon={<ArrowLeft className="w-5 h-5" />}>
                Geri
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-[#1F2937]">Yeni sifariş</h1>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Price per m² */}
              <Card className="p-4 bg-gradient-to-r from-[#D90429] to-[#EF476F] text-white">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">1 m² =</span>
                  <span className="text-3xl font-bold">{effectiveUnitPrice} AZN</span>
                </div>
              </Card>

              {/* Product Selection */}
              <Card className="p-6">
                <label className="block text-sm font-medium text-[#6B7280] mb-3">Məhsul adı</label>
                <select
                  value={selectedProduct.id}
                  onChange={(e) => {
                    const product = catalog.find((p) => p.id === e.target.value);
                    if (!product) return;
                    setSelectedProduct(product);
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D90429] text-lg"
                >
                  {catalog.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Card>

              {/* Payment Method */}
              <Card className="p-6">
                <label className="block text-sm font-medium text-[#6B7280] mb-3">Ödəniş növü</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "cash", label: "Nəğd", icon: "💵" },
                    { id: "card", label: "Kart", icon: "💳" },
                    { id: "debt", label: "Borc", icon: "📋", disabled: !canUseDebt }
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => !method.disabled && setPaymentMethod(method.id as any)}
                      disabled={method.disabled}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === method.id
                          ? "border-[#D90429] bg-[#D90429]/5"
                          : method.disabled
                          ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-2xl mb-1 block">{method.icon}</span>
                      <span className="text-sm font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>
                
                {/* Debt Warning */}
                {!canUseDebt && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700">
                      ⚠️ Borc sistemi yalnız admin üçün aktivdir.
                    </p>
                  </div>
                )}
              </Card>

              {/* Sizes Section */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Ruler className="w-5 h-5 text-[#D90429]" />
                  <h3 className="font-semibold text-[#1F2937]">Ölçülər</h3>
                </div>

                <div className="space-y-4">
                  {sizes.map((size, index) => (
                    <div key={size.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-xs text-[#6B7280] mb-1">En (m)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={size.width}
                            onChange={(e) => updateSize(size.id, "width", parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#6B7280] mb-1">Hündürlük (m)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={size.height}
                            onChange={(e) => updateSize(size.id, "height", parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#6B7280] mb-1">Sahə (m²)</label>
                          <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-[#1F2937] font-medium">
                            {size.area.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-4 text-sm">
                          <span className="text-[#6B7280]">Baza: <span className="text-[#1F2937] font-medium">{size.basePrice.toFixed(2)} AZN</span></span>
                          {totals.discountRate > 0 && (
                            <span className="text-[#6B7280]">Endirimli: <span className="text-green-600 font-medium">{(size.basePrice * (1 - totals.discountRate)).toFixed(2)} AZN</span></span>
                          )}
                        </div>
                        {sizes.length > 1 && (
                          <button
                            onClick={() => removeSize(size.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  onClick={addSize}
                  icon={<Plus className="w-4 h-4" />}
                  className="mt-4 w-full"
                >
                  Yeni ölçü əlavə et
                </Button>
              </Card>

              {/* Customer Phone */}
              <Card className="p-6">
                <label className="flex items-center gap-2 text-sm font-medium text-[#6B7280] mb-3">
                  <Phone className="w-4 h-4" />
                  Müştəri telefonu
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+9945079888177"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                />
              </Card>

              {/* Note */}
              <Card className="p-6">
                <label className="flex items-center gap-2 text-sm font-medium text-[#6B7280] mb-3">
                  <FileText className="w-4 h-4" />
                  Qeyd
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Əlavə qeyd yaz..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D90429] resize-none"
                />
              </Card>
            </motion.div>

            {/* Summary Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <Card className="p-6 sticky top-24">
                <div className="flex items-center gap-2 mb-6">
                  <Calculator className="w-5 h-5 text-[#D90429]" />
                  <h3 className="font-bold text-[#1F2937]">Hesablamalar</h3>
                </div>

                {/* Loyalty Discount Info */}
                <div className={`p-4 rounded-lg mb-4 ${
                  totals.discountTier === "10percent" 
                    ? "bg-green-100 border border-green-200" 
                    : totals.discountTier === "5percent"
                    ? "bg-blue-100 border border-blue-200"
                    : "bg-gray-100"
                }`}>
                  <p className="text-sm font-medium mb-1">
                    {getDiscountMessage(totals.discountTier, loyaltyPercentOverride, loyaltyEligibility)}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    Bonus həddi üçün cari ayda yalnız admin tərəfindən təsdiqlənmiş sifarişlərin baza məbləği
                    (loyalty endirimindən əvvəl) toplanır; gözləmədə (pending) sifarişlər bu məbləğə daxil deyil.
                    Hazırkı sifarişin bazası indidən əlavə olunur.
                  </p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Təsdiqlənmiş bu ay: {priorOrderTotal.toFixed(2)} AZN • Bu sifarişlə birlikdə (baza):{" "}
                    {totals.lifetimeTotal.toFixed(2)} AZN
                  </p>
                  {totals.discountRate > 0 && (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      🎉 Bu sifarişdə {(totals.discountRate * 100)}% endirim tətbiq olunur!
                    </p>
                  )}
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Ümumi sahə:</span>
                    <span className="font-medium">{totals.totalArea.toFixed(2)} m²</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Toplam baza qiymət:</span>
                    <span className="font-medium">{totals.totalBase.toFixed(2)} AZN</span>
                  </div>

                  {totals.totalDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">Loyalty endirim ({(totals.discountRate * 100)}%):</span>
                      <span className="font-medium text-green-600">-{totals.totalDiscount.toFixed(2)} AZN</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between">
                      <span className="text-[#1F2937] font-semibold">Yekun məbləğ:</span>
                      <span className="text-2xl font-bold text-[#D90429]">{totals.finalAmount.toFixed(2)} AZN</span>
                    </div>
                  </div>
                </div>

                {/* Payment Warning */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                      ⚠️ Ödəniş məlumatı: Sifariş yaratmazdan əvvəl ödəniş etməlisiniz. 
                      Ödəniş edildikdən sonra sifarişiniz admin tərəfindən təsdiqlənəcək.
                    </p>
                  </div>
                </div>

                {/* Estimated Amount */}
                <div className="p-4 bg-gray-50 rounded-lg mb-6">
                  <p className="text-sm text-[#6B7280] mb-1">Təxmini məbləğ:</p>
                  <p className="text-xl font-bold text-[#1F2937]">{totals.finalAmount.toFixed(2)} AZN</p>
                </div>

                <Button
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={submitting}
                  className="w-full"
                  icon={submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                >
                  {submitting ? "Ödəniş emal olunur..." : "Sifariş yarat"}
                </Button>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
