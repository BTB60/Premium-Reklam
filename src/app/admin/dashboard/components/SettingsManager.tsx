"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Save, RotateCcw, DollarSign, Award, Package } from "lucide-react";
import { settings } from "@/lib/db";

export default function SettingsManager() {
  const [formData, setFormData] = useState({
    unitPricePerSqm: 10,
    loyaltyBonusEnabled: true,
    monthlyBonus500: 5,
    monthlyBonus1000: 10,
    bannerDiscount: 0,
    vinylDiscount: 0,
    posterDiscount: 0,
    canvasDiscount: 0,
    oracalDiscount: 0,
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const current = settings.get();
    setFormData({
      unitPricePerSqm: current.unitPricePerSqm || 10,
      loyaltyBonusEnabled: current.loyaltyBonusEnabled !== false,
      monthlyBonus500: current.monthlyBonus500 || 5,
      monthlyBonus1000: current.monthlyBonus1000 || 10,
      bannerDiscount: current.productDiscounts?.banner || 0,
      vinylDiscount: current.productDiscounts?.vinyl || 0,
      posterDiscount: current.productDiscounts?.poster || 0,
      canvasDiscount: current.productDiscounts?.canvas || 0,
      oracalDiscount: current.productDiscounts?.oracal || 0,
    });
  }, []);

  const handleSave = () => {
    setLoading(true);
    try {
      settings.update({
        unitPricePerSqm: formData.unitPricePerSqm,
        loyaltyBonusEnabled: formData.loyaltyBonusEnabled,
        monthlyBonus500: formData.monthlyBonus500,
        monthlyBonus1000: formData.monthlyBonus1000,
        productDiscounts: {
          banner: formData.bannerDiscount,
          vinyl: formData.vinylDiscount,
          poster: formData.posterDiscount,
          canvas: formData.canvasDiscount,
          oracal: formData.oracalDiscount,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("[Settings] Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const reset = settings.reset();
    setFormData({
      unitPricePerSqm: reset.unitPricePerSqm || 10,
      loyaltyBonusEnabled: reset.loyaltyBonusEnabled !== false,
      monthlyBonus500: reset.monthlyBonus500 || 5,
      monthlyBonus1000: reset.monthlyBonus1000 || 10,
      bannerDiscount: reset.productDiscounts?.banner || 0,
      vinylDiscount: reset.productDiscounts?.vinyl || 0,
      posterDiscount: reset.productDiscounts?.poster || 0,
      canvasDiscount: reset.productDiscounts?.canvas || 0,
      oracalDiscount: reset.productDiscounts?.oracal || 0,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1F2937]">Sistem Ayarları</h1>
        {saved && (
          <span className="text-green-600 font-medium flex items-center gap-2">
            ✓ Ayarlar yadda saxlandı!
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Цена за м² */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#D90429]" />
            Qiymət Ayarları
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">
                1 m² qiymət (AZN)
              </label>
              <input
                type="number"
                value={formData.unitPricePerSqm}
                onChange={(e) =>
                  setFormData({ ...formData, unitPricePerSqm: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
              />
            </div>
          </div>
        </Card>

        {/* Бонусы */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#D90429]" />
            Bonus endirim (ümumi sifariş məbləği)
          </h2>
          <p className="text-xs text-[#6B7280] mb-3">
            Müştərinin bütün vaxt üzrə ümumi sifariş məbləyi hədd keçəndə növbəti sifarişlərə tətbiq olunacaq endirim faizi.
            Hədlər: 500 AZN və 1000 AZN (sabit).
          </p>
          <label className="flex items-center gap-2 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={formData.loyaltyBonusEnabled}
              onChange={(e) =>
                setFormData({ ...formData, loyaltyBonusEnabled: e.target.checked })
              }
              className="rounded border-gray-300 text-[#D90429] focus:ring-[#D90429]"
            />
            <span className="text-sm font-medium text-[#1F2937]">
              Bonus endirim proqramı aktivdir
            </span>
          </label>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">
                500 AZN ümumi sifarişdən sonra endirim (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.monthlyBonus500}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyBonus500: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">
                1000 AZN ümumi sifarişdən sonra endirim (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.monthlyBonus1000}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyBonus1000: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
              />
            </div>
          </div>
        </Card>

        {/* Скидки на продукцию */}
        <Card className="p-6 md:col-span-2">
          <h2 className="text-lg font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#D90429]" />
            Məhsul Endirimləri (%)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { key: "bannerDiscount", label: "Banner" },
              { key: "vinylDiscount", label: "Vinil" },
              { key: "posterDiscount", label: "Poster" },
              { key: "canvasDiscount", label: "Kətan" },
              { key: "oracalDiscount", label: "Oracal" },
            ].map((item) => (
              <div key={item.key}>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">
                  {item.label}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData[item.key as keyof typeof formData]}
                  onChange={(e) =>
                    setFormData({ ...formData, [item.key]: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex gap-4 mt-6">
        <Button onClick={handleSave} loading={loading} icon={<Save className="w-4 h-4" />}>
          Ayarları yadda saxla
        </Button>
        <Button variant="secondary" onClick={handleReset} icon={<RotateCcw className="w-4 h-4" />}>
          Default-a qaytar
        </Button>
      </div>
    </div>
  );
}