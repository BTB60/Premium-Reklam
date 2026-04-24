"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  type Product,
  type User,
  calculateDiscount,
  getLoyaltyBonusProgress,
  type LoyaltyPercentOverride,
} from "@/lib/db";
import { Calculator, Plus, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface PriceCalculatorProps {
  availableProducts: Product[];
  user: User;
  /** Backend: cari təqvim ayı üzrə sifariş cəmi (bonus həddi üçün; ay sonunda sıfırlanır). */
  lifetimeOrderTotalAzn?: number;
  loyaltyPercentOverride?: LoyaltyPercentOverride;
  /** Müştəri üzrə xüsusi qiymət cədvəlidirsə bonus tətbiq olunmur. */
  hasCustomUserPrices?: boolean;
}

export function PriceCalculator({
  availableProducts,
  user,
  lifetimeOrderTotalAzn,
  loyaltyPercentOverride = null,
  hasCustomUserPrices = false,
}: PriceCalculatorProps) {
  const [items, setItems] = useState<
    { productId: string; width: string; height: string; quantity: string }[]
  >([{ productId: "", width: "", height: "", quantity: "1" }]);

  const spentForBonus = lifetimeOrderTotalAzn ?? (Number(user.totalSales) || 0);

  const loyaltyEligibility = useMemo(() => ({ hasCustomUserPrices }), [hasCustomUserPrices]);

  const loyaltyDiscount = useMemo(() => {
    const d = calculateDiscount(spentForBonus, loyaltyPercentOverride, loyaltyEligibility);
    return { rate: d.rate, label: `${d.activePercent}%` };
  }, [spentForBonus, loyaltyPercentOverride, loyaltyEligibility]);

  const loyaltyProgress = useMemo(
    () => getLoyaltyBonusProgress(spentForBonus, loyaltyPercentOverride, loyaltyEligibility),
    [spentForBonus, loyaltyPercentOverride, loyaltyEligibility]
  );

  const calculateItemPrice = (item: (typeof items)[0]) => {
    const product = availableProducts.find((p) => p.id === item.productId);
    if (!product) return 0;

    const width = parseFloat(item.width) || 0;
    const height = parseFloat(item.height) || 0;
    const quantity = parseInt(item.quantity) || 1;

    if (product.unit === "m²" && width > 0 && height > 0) {
      const area = width * height; // istifadəçi ölçüləri ilə eyni ölçü vahidi (əvvəlki davranış)
      const unitSqm = Number(product.basePrice) || 0;
      return area * unitSqm * quantity;
    }

    const basePrice = (product as any).price || (product as any).basePrice || 0;
    return basePrice * quantity;
  };

  const subtotal = items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
  const discountAmount = subtotal * loyaltyDiscount.rate;
  const total = subtotal - discountAmount;

  const addItem = () => {
    setItems([...items, { productId: "", width: "", height: "", quantity: "1" }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleOrder = () => {
    const validItems = items
      .filter((i) => i.productId)
      .map((i) => {
        const product = availableProducts.find((p) => p.id === i.productId);
        return {
          productId: i.productId,
          productName: product?.name || "",
          width: parseFloat(i.width) || undefined,
          height: parseFloat(i.height) || undefined,
          quantity: parseInt(i.quantity) || 1,
        };
      });

    if (validItems.length > 0) {
      localStorage.setItem("calculator_items", JSON.stringify(validItems));
      window.location.href = "/orders/new?fromCalculator=true";
    }
  };

  return (
    <div className="space-y-6">
      {/* Discount Info */}
      <Card className="p-4 bg-gradient-to-r from-[#D90429] to-[#EF476F] text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">Sənin endirimin</p>
            <p className="text-2xl font-bold">{loyaltyDiscount.label}</p>
            <p className="text-white/80 text-xs">
              Bonus üçün bu ay: {spentForBonus.toFixed(0)} AZN
            </p>
          </div>
          <div className="text-right max-w-[55%]">
            <p className="text-white/80 text-sm">Növbəti hədd</p>
            <p className="text-sm font-semibold leading-tight">
              {loyaltyProgress.nextThresholdAzn != null
                ? `${Math.max(0, loyaltyProgress.nextThresholdAzn - spentForBonus).toFixed(0)} AZN qalıb`
                : "—"}
            </p>
            <p className="text-white/80 text-xs mt-1 line-clamp-2">{loyaltyProgress.hint}</p>
          </div>
        </div>
      </Card>

      {/* Calculator */}
      <Card className="p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Qiymət Hesablayıcı
        </h3>

        <div className="space-y-4">
          {items.map((item, index) => {
            const product = availableProducts.find((p) => p.id === item.productId);
            const itemPrice = calculateItemPrice(item);

            return (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="grid md:grid-cols-5 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">
                      Məhsul
                    </label>
                    <select
                      value={item.productId}
                      onChange={(e) =>
                        updateItem(index, "productId", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Məhsul seçin</option>
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (
                          {p.unit === "m²"
                            ? `${(p.basePrice || 0).toFixed(2)} AZN/m²`
                            : `${((p as any).price || p.basePrice || 0).toFixed(2)} AZN/${p.unit}`}
                          )
                        </option>
                      ))}
                    </select>
                  </div>

                  {product?.unit === "m²" && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          En (sm)
                        </label>
                        <input
                          type="number"
                          value={item.width}
                          onChange={(e) =>
                            updateItem(index, "width", e.target.value)
                          }
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Hündürlük (sm)
                        </label>
                        <input
                          type="number"
                          value={item.height}
                          onChange={(e) =>
                            updateItem(index, "height", e.target.value)
                          }
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="100"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Say
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      min="1"
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">
                        Qiymət
                      </label>
                      <p className="text-lg font-bold text-[#D90429]">
                        {itemPrice.toFixed(2)} AZN
                      </p>
                    </div>
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <Button variant="ghost" onClick={addItem} icon={<Plus className="w-4 h-4" />}>
            Məhsul əlavə et
          </Button>
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cəm</span>
              <span>{subtotal.toFixed(2)} AZN</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Endirim ({loyaltyDiscount.label})</span>
                <span>-{discountAmount.toFixed(2)} AZN</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold pt-2">
              <span>Ümumi</span>
              <span className="text-[#D90429]">{total.toFixed(2)} AZN</span>
            </div>
          </div>

          <Link href="/dashboard/orders/new" className="block mt-4">
            <Button
              disabled={!items.some((i) => i.productId)}
              className="w-full"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sifariş Et
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
