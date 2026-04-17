// src/app/admin/dashboard/components/ShopsManager.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { 
  Search, Download, Plus, Edit, Trash2, Save, X, Store, AlertCircle,
  MapPin, Phone, Mail, Calendar, CheckCircle, Users, Eye, Bell, DollarSign, Wallet
} from "lucide-react";
import Link from "next/link";
import { notifications } from "@/lib/db/orders";

interface VendorStore {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  logo?: string;
  banner?: string;
  address: string;
  phone: string;
  email: string;
  category: string[];
  isActive: boolean;
  isApproved: boolean;
  rating: number;
  reviewCount: number;
  totalSales: number;
  commissionRate: number;
  totalOrderAmount: number;
  totalBonusEarned: number;
  createdAt: string;
  updatedAt: string;
}

const VENDOR_STORES_KEY = "decor_vendor_stores";

export default function ShopsManager() {
  const [shops, setShops] = useState<VendorStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState<Partial<VendorStore>>({
    name: "", description: "", address: "", phone: "", email: "", category: [], isActive: true, isApproved: true
  });

  const loadShops = useCallback(async () => {
    try {
      setLoading(true);
      const raw = localStorage.getItem(VENDOR_STORES_KEY);
      if (raw) {
        const allStores: VendorStore[] = JSON.parse(raw);
        setShops(allStores.filter(s => s.isApproved && s.isActive));
      }
    } catch (error) {
      console.error("[Shops] Load error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  // ✅ КРОСС-ТАБ + INTRA-TAB СИНХРОНИЗАЦИЯ
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === VENDOR_STORES_KEY) {
        loadShops();
      }
    };
    const handleCustom = () => loadShops();
    
    // Подписка на оба типа событий
    window.addEventListener("storage", handleStorage);
    window.addEventListener(`storage:${VENDOR_STORES_KEY}`, handleCustom);
    
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(`storage:${VENDOR_STORES_KEY}`, handleCustom);
    };
  }, [loadShops]);

  const handleDeactivate = async (store: VendorStore) => {
    const reason = prompt(`Səbəb daxil edin (İstifadəçi ${store.vendorId} üçün):`, "Qaydaların pozulması");
    if (reason === null) return;

    try {
      const raw = localStorage.getItem(VENDOR_STORES_KEY);
      if (raw) {
        const all: VendorStore[] = JSON.parse(raw);
        const updated = all.map(s => 
          s.id === store.id 
            ? { ...s, isActive: false, updatedAt: new Date().toISOString() } 
            : s
        );
        localStorage.setItem(VENDOR_STORES_KEY, JSON.stringify(updated));
        // ✅ Триггерим событие вручную для той же вкладки (дублирующая страховка)
        window.dispatchEvent(new StorageEvent("storage", { key: VENDOR_STORES_KEY }));
        window.dispatchEvent(new CustomEvent(`storage:${VENDOR_STORES_KEY}`, { detail: updated }));
      }

      const today = new Date().toLocaleDateString("az-AZ");
      notifications.create({
        userId: store.vendorId,
        title: "Mağaza ləğv edildi",
        message: `Sizin mağazanız Administrator tərəfindən ləğv edilmişdir. Səbəb: ${reason || "Göstərilməyib"}. Tarix: ${today}`,
        type: "system",
      });

      loadShops();
      alert("Mağaza deaktiv edildi və istifadəçiyə bildiriş göndərildi.");
    } catch (e: any) {
      console.error("[Shops] Deactivate error:", e);
      alert("Xəta baş verdi: " + e.message);
    }
  };

  const handleExport = () => {
    const headers = ["ID", "Mağaza", "Vendor ID", "Telefon", "Email", "Ünvan", "Kateqoriyalar", "Ümumi Sifariş", "Bonus", "Tarix"];
    const rows = shops.map(s => [
      s.id, s.name, s.vendorId, s.phone, s.email || "-", s.address, s.category.join(", "), 
      (s.totalOrderAmount || 0).toFixed(2), (s.totalBonusEarned || 0).toFixed(2), new Date(s.createdAt).toLocaleDateString("az-AZ")
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shops_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredShops = shops.filter(s => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.vendorId.toLowerCase().includes(q) || s.address.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D90429] mx-auto" />
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Store className="w-8 h-8 text-[#D90429]" />
          <h1 className="text-2xl font-bold text-[#1F2937]">Mağazalar</h1>
        </div>
        <Button onClick={handleExport} variant="ghost" size="sm" icon={<Download className="w-4 h-4" />}>
          Export
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-[#6B7280] text-sm">Ümumi Aktiv</p>
          <p className="text-2xl font-bold text-[#1F2937]">{shops.length}</p>
        </Card>
        <Card className="p-4 bg-green-50">
          <p className="text-green-600 text-sm">Reytinq (Ort.)</p>
          <p className="text-2xl font-bold text-green-700">
            {shops.length ? (shops.reduce((a, s) => a + s.rating, 0) / shops.length).toFixed(1) : "0.0"}
          </p>
        </Card>
        <Card className="p-4 bg-amber-50">
          <p className="text-amber-600 text-sm">Ümumi Satış</p>
          <p className="text-2xl font-bold text-amber-700">{shops.reduce((a, s) => a + (s.totalSales || 0), 0)}</p>
        </Card>
        <Card className="p-4 bg-blue-50">
          <p className="text-blue-600 text-sm flex items-center gap-1"><DollarSign className="w-4 h-4"/> Ümumi Dövriyyə</p>
          <p className="text-2xl font-bold text-blue-700">{shops.reduce((a, s) => a + (s.totalOrderAmount || 0), 0).toFixed(2)} AZN</p>
        </Card>
      </div>

      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Axtar: mağaza adı, vendor ID, ünvan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Mağaza</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Vendor</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Əlaqə</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Dövriyyə</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Bonus</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {filteredShops.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#6B7280]">
                    Mağaza tapılmadı
                  </td>
                </tr>
              ) : (
                filteredShops.map((shop) => (
                  <tr key={shop.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#D90429]/10 rounded-full flex items-center justify-center">
                          <Store className="w-5 h-5 text-[#D90429]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1F2937]">{shop.name}</p>
                          {shop.description && <p className="text-xs text-[#6B7280] line-clamp-1">{shop.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded inline-block">{shop.vendorId}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {shop.category.map((c, i) => (
                          <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 rounded">{c}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1 text-xs">
                        {shop.phone && (
                          <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {shop.phone}</div>
                        )}
                        {shop.email && (
                          <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {shop.email}</div>
                        )}
                        {shop.address && (
                          <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {shop.address}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#1F2937]">
                      {(shop.totalOrderAmount || 0).toFixed(2)} AZN
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full w-fit">
                        <Wallet className="w-3.5 h-3.5" />
                        {(shop.totalBonusEarned || 0).toFixed(2)} AZN
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status="active" />
                      <p className="text-xs text-[#6B7280] mt-1">⭐ {shop.rating.toFixed(1)} ({shop.reviewCount})</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Link href={`/store/${shop.id}`} className="p-2 text-blue-500 hover:bg-blue-50 rounded" title="Bax">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDeactivate(shop)} 
                          className="p-2 text-red-500 hover:bg-red-50 rounded" 
                          title="Mağazanı sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// EOF