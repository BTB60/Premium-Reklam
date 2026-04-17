// src/app/dashboard/orders/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { productApi, orderApi } from "@/lib/authApi";
import { auth, orders } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, RefreshCw, CheckCircle, User, Phone, MapPin, Wallet, AlertTriangle } from "lucide-react";

interface UserData {
  id: string;
  fullName: string;
  username: string;
  phone?: string;
  email?: string;
  role: string;
}

export default function NewOrderPage() {
  const router = useRouter();
  
  // State: Загрузка и данные
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  // State: Форма заказа
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // State: Бонусная система
  const [availableBonus, setAvailableBonus] = useState(0);
  const [useBonus, setUseBonus] = useState(false);

  useEffect(() => {
    // 1. Загрузка сессии и бонусов
    const user = auth.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      
      // ✅ ИСПРАВЛЕНИЕ: Выбор имени для автозаполнения
      // Если fullName пустой или содержит "Administrator" (дефолт админа), берем username
      const safeName = (user.fullName && user.fullName.trim() && !user.fullName.toLowerCase().includes("administrator")) 
        ? user.fullName 
        : user.username;
      
      setCustomerName(safeName || "");
      setCustomerPhone(user.phone || "");
      setAvailableBonus(auth.getAvailableBonus(user.id));
    }
    
    // 2. Загрузка товаров
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productApi.getAll();
      setProducts(data.filter((p: any) => p.isActive === true || p.status === "ACTIVE") || []);
    } catch (error) {
      console.error("Load products error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Расчеты
  const currentPrice = selectedProduct ? (selectedProduct.salePrice ?? selectedProduct.basePrice ?? 0) : 0;
  const totalArea = (parseFloat(width) || 0) * (parseFloat(height) || 0) * (parseInt(quantity) || 1);
  const baseTotal = totalArea * currentPrice;
  
  // Логика бонусов
  const canUseBonus = availableBonus >= 10 && baseTotal > 0;
  const maxApplicableBonus = Math.min(availableBonus, baseTotal);
  const appliedBonus = useBonus ? maxApplicableBonus : 0;
  const cashToPay = Math.max(0, baseTotal - appliedBonus);

  const handleSubmit = async () => {
    if (!selectedProduct) { alert("Məhsul seçilməyib"); return; }
    if (!width || !height) { alert("Zəhmət olmasa Ölçüləri doldurun"); return; }
    if (!currentUser) { alert("Sessiya tapılmadı. Zəhmət olmasa daxil olun."); router.push("/login"); return; }
    if (!customerName.trim()) { alert("Müştərinin adı tələb olunur"); return; }

    setSubmitting(true);
    try {
      const orderPayload = {
        userId: currentUser.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        customerWhatsapp: customerPhone.trim(),
        note,
        discountPercent: 0,
        paymentMethod: cashToPay > 0 ? "cash" : "bonus",
        items: [{
          productId: String(selectedProduct.id),
          productName: selectedProduct.name,
          unit: selectedProduct.unit,
          quantity: parseInt(quantity) || 1,
          width: parseFloat(width),
          height: parseFloat(height),
          unitPrice: currentPrice,
          totalPrice: baseTotal,
        }],
        subtotal: baseTotal,
        discountTotal: 0,
        finalTotal: baseTotal,
        totalAmount: baseTotal,
        paidAmount: appliedBonus,
        remainingAmount: cashToPay,
        bonusUsed: appliedBonus,
        paymentBreakdown: {
          cash: cashToPay,
          bonus: appliedBonus,
          total: baseTotal,
        },
      };

      await orderApi.create(orderPayload);

      alert("Sifariş uğurla yaradıldı!");
      router.push("/dashboard/orders");
    } catch (error: any) {
      console.error("Order create error:", error);
      alert(error.message || "Sifariş yaradılmadı");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => router.back()} 
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
        </button>
        <h1 className="text-2xl font-bold text-[#1F2937]">Yeni Sifariş</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-[#D90429]" /></div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Левая колонка: Форма */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">Məhsul və Ölçülər</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#6B7280] mb-2">Məhsul *</label>
                  <select
                    value={selectedProduct?.id || ""}
                    onChange={(e) => {
                      const prod = products.find((p) => p.id.toString() === e.target.value);
                      setSelectedProduct(prod);
                    }}
                    className="w-full h-12 rounded-xl border border-[#E5E7EB] px-4 bg-white focus:outline-none focus:border-[#D90429]"
                  >
                    <option value="">Məhsul seçin...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({(p.salePrice ?? p.basePrice ?? 0).toFixed(2)} AZN/{p.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-[#6B7280] mb-2">En (m)</label>
                    <input type="number" step="0.01" value={width} onChange={(e) => setWidth(e.target.value)} className="w-full h-12 rounded-xl border border-[#E5E7EB] px-4" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#6B7280] mb-2">Hündürlük (m)</label>
                    <input type="number" step="0.01" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full h-12 rounded-xl border border-[#E5E7EB] px-4" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#6B7280] mb-2">Ədəd</label>
                    <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full h-12 rounded-xl border border-[#E5E7EB] px-4" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-[#D90429]" /> Müştəri Məlumatları</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#6B7280] mb-2">Ad, Soyad *</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full h-12 rounded-xl border border-[#E5E7EB] pl-10 pr-4 focus:outline-none focus:border-[#D90429]" placeholder="Müştərinin adı" />
                  </div>
                  <p className="text-xs text-[#6B7280] mt-1">Profilinizdən doldurulub, dəyişə bilərsiniz</p>
                </div>
                <div>
                  <label className="block text-sm text-[#6B7280] mb-2">Telefon</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full h-12 rounded-xl border border-[#E5E7EB] pl-10 pr-4 focus:outline-none focus:border-[#D90429]" placeholder="050..." />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[#6B7280] mb-2">Ünvan (Çatdırılma)</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="w-full h-12 rounded-xl border border-[#E5E7EB] pl-10 pr-4 focus:outline-none focus:border-[#D90429]" placeholder="Bakı, Nəsimi rayonu..." />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[#6B7280] mb-2">Qeyd</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 min-h-[100px]" placeholder="Əlavə qeydlər..." />
                </div>
              </div>
            </Card>
          </div>

          {/* Правая колонка: Итого + Бонусы */}
          <div>
            <Card className="p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-4">Sifarişin Xülasəsi</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Məhsul:</span>
                  <span className="font-medium truncate ml-2 max-w-[60%]">{selectedProduct?.name || "-"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Sahə:</span>
                  <span className="font-medium">{totalArea.toFixed(2)} m²</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Qiymət:</span>
                  <span className="font-medium">{currentPrice.toFixed(2)} AZN</span>
                </div>
                
                {/* Бонусный блок */}
                <div className={`mt-4 p-3 rounded-xl border transition-all ${useBonus ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <Wallet className={`w-4 h-4 ${availableBonus >= 10 ? "text-green-600" : "text-gray-400"}`} />
                      Bonus Balans: {availableBonus.toFixed(2)} AZN
                    </span>
                    {canUseBonus && (
                      <button
                        type="button"
                        onClick={() => setUseBonus(!useBonus)}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                          useBonus 
                            ? "bg-blue-600 text-white hover:bg-blue-700" 
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {useBonus ? "İstifadə edilir" : "İstifadə et"}
                      </button>
                    )}
                  </div>
                  
                  {availableBonus < 10 && baseTotal > 0 && (
                    <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3" />
                      Minimum {(10).toFixed(2)} AZN bonus yığılmalıdır
                    </p>
                  )}
                  
                  {useBonus && canUseBonus && (
                    <div className="mt-2 text-sm text-blue-700 font-medium">
                      -{appliedBonus.toFixed(2)} AZN endirim tətbiq edildi
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E5E7EB] space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Ümumi məbləğ:</span>
                    <span className="font-medium">{baseTotal.toFixed(2)} AZN</span>
                  </div>
                  {appliedBonus > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Bonus ödənişi:</span>
                      <span className="font-medium">-{appliedBonus.toFixed(2)} AZN</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-lg font-bold text-[#1F2937]">Ödəniləcək:</span>
                    <span className="text-2xl font-bold text-[#D90429]">{cashToPay.toFixed(2)} AZN</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSubmit} 
                className={`w-full py-4 text-lg ${appliedBonus > 0 ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg hover:shadow-blue-500/30" : ""}`}
                disabled={submitting || !selectedProduct || !width || !height || !customerName.trim()}
                icon={submitting ? <RefreshCw className="animate-spin" /> : <CheckCircle />}
              >
                {submitting 
                  ? "Göndərilir..." 
                  : appliedBonus > 0 
                    ? `Bonusla ${cashToPay.toFixed(2)} AZN ödə` 
                    : `Sifarişi Təsdiqlə`
                }
              </Button>
              {cashToPay === 0 && useBonus && (
                <p className="text-center text-xs text-green-600 mt-2">✅ Tam məbləğ bonusla ödənilir</p>
              )}
            </Card>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// EOF