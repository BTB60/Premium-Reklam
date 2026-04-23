"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getVendorStoreCategoryOptions, normalizeVendorStoreCategories } from "@/lib/vendorStoreCategories";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Store, MapPin, Phone, Mail, Edit, Image, X, CheckCircle, Loader2, Package, Eye } from "lucide-react";
import Link from "next/link";
import type { VendorStore } from "@/lib/db";
import {
  getEffectiveHighlightTier,
  getVipExpiryDisplay,
  highlightTierBadgeClass,
  highlightTierLabel,
} from "@/lib/vendorStoreHighlight";

export default function ApprovedStoreView({ 
  store, 
  products, 
  onUpdate 
}: { 
  store: VendorStore; 
  products: any[]; 
  onUpdate: (data: any) => Promise<boolean>; 
}) {
  const router = useRouter();
  const [showEditForm, setShowEditForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [editData, setEditData] = useState({
    name: store.name,
    description: store.description,
    address: store.address,
    phone: store.phone,
    email: store.email || "",
    logo: store.logo || "",
    banner: store.banner || "",
    categories: normalizeVendorStoreCategories(store.category),
  });

  const categories = getVendorStoreCategoryOptions();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: "logo" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setEditData(prev => ({ ...prev, [field]: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const success = await onUpdate({
      ...editData,
      categories: normalizeVendorStoreCategories(editData.categories),
    });
    if (success) setShowEditForm(false);
    setSubmitting(false);
  };

  return (
    <>
      <div className="relative mb-8">
        <div className="h-48 bg-gradient-to-r from-[#D90429] to-[#EF476F] rounded-2xl overflow-hidden">
          {store.banner ? <img src={store.banner} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Store className="w-16 h-16 text-white/30" /></div>}
        </div>
        <div className="absolute -bottom-12 left-8">
          <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center overflow-hidden border-4 border-white">
            {store.logo ? <img src={store.logo} alt="" className="w-full h-full object-cover" /> : <Store className="w-12 h-12 text-[#D90429]" />}
          </div>
        </div>
      </div>

      <div className="ml-36 mb-6">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h2 className="text-2xl font-bold text-[#1F2937]">{store.name}</h2>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">Aktiv</span>
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full ${highlightTierBadgeClass(getEffectiveHighlightTier(store))}`}
          >
            {highlightTierLabel(getEffectiveHighlightTier(store))}
          </span>
        </div>
        <p className="text-[#6B7280]">{store.description}</p>
      </div>

      <Card className="p-4 mb-6 border border-amber-100 bg-amber-50/60">
        <p className="text-sm font-semibold text-[#1F2937] mb-2">Marketplace görünürlüyü</p>
        {getEffectiveHighlightTier(store) === "vip" && getVipExpiryDisplay(store) ? (
          <p className="text-xs text-amber-800 mb-2">
            Müddətli VIP — bitmə: <strong>{getVipExpiryDisplay(store)}</strong>. Bitəndən sonra paket:{" "}
            <strong>{store.tierAfterVip === "standard" ? "Standart" : "Premium"}</strong>.
          </p>
        ) : null}
        {getEffectiveHighlightTier(store) === "vip" && !getVipExpiryDisplay(store) ? (
          <p className="text-xs text-amber-800 mb-2">
            <strong>VIP (limitsiz)</strong> — Marketplace-də ən ön sıra.
          </p>
        ) : null}
        <p className="text-sm text-[#6B7280] leading-relaxed">
          {getEffectiveHighlightTier(store) === "vip" && (
            <>
              <strong>VIP</strong> paketində mağazanız Marketplace siyahısında ən öndə göstərilir.
            </>
          )}
          {getEffectiveHighlightTier(store) === "premium" && (
            <>
              <strong>Premium</strong> paketində VIP mağazalardan sonra, standart mağazalardan əvvəl
              yerləşirsiniz.
            </>
          )}
          {getEffectiveHighlightTier(store) === "standard" && (
            <>
              <strong>Standart</strong> sıralama: Premium və VIP paketli mağazalardan sonra
              göstərilirsiniz. Paket təyinatı üçün admin ilə əlaqə saxlayın.
            </>
          )}
        </p>
      </Card>

      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowEditForm(true)} icon={<Edit className="w-4 h-4" />}>Redaktə Et</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6"><div className="flex items-center gap-4"><MapPin className="w-6 h-6 text-[#D90429]" /><div><p className="text-sm text-[#6B7280]">Ünvan</p><p className="font-medium">{store.address}</p></div></div></Card>
        <Card className="p-6"><div className="flex items-center gap-4"><Phone className="w-6 h-6 text-[#D90429]" /><div><p className="text-sm text-[#6B7280]">Telefon</p><p className="font-medium">{store.phone}</p></div></div></Card>
        <Card className="p-6"><div className="flex items-center gap-4"><Mail className="w-6 h-6 text-[#D90429]" /><div><p className="text-sm text-[#6B7280]">Email</p><p className="font-medium">{store.email || "-"}</p></div></div></Card>
      </div>

      <Card className="p-6 mb-6">
        <h3 className="font-bold text-[#1F2937] mb-4">Kateqoriyalar</h3>
        <div className="flex flex-wrap gap-2">{store.category.map((cat: string, idx: number) => <span key={idx} className="px-4 py-2 bg-[#D90429]/10 text-[#D90429] rounded-full text-sm font-medium">{cat}</span>)}</div>
      </Card>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card className="p-6 text-center"><p className="text-3xl font-bold text-[#D90429]">{store.totalSales}</p><p className="text-sm text-[#6B7280]">Ümumi Satış</p></Card>
        <Card className="p-6 text-center"><p className="text-3xl font-bold text-[#D90429]">{store.rating.toFixed(1)}</p><p className="text-sm text-[#6B7280]">Reytinq</p></Card>
        <Card className="p-6 text-center"><p className="text-3xl font-bold text-[#D90429]">{store.reviewCount}</p><p className="text-sm text-[#6B7280]">Rəy</p></Card>
        <Card className="p-6 text-center"><p className="text-3xl font-bold text-[#D90429]">{products.length}</p><p className="text-sm text-[#6B7280]">Məhsul</p></Card>
      </div>

      <div className="flex gap-4">
        <Link href={`/store/${store.id}`}><Button icon={<Eye className="w-4 h-4" />}>Mağazaya Bax</Button></Link>
        <Link href="/dashboard/store/products"><Button variant="secondary" icon={<Package className="w-4 h-4" />}>Məhsulları İdarə Et</Button></Link>
      </div>

      {/* Edit Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E5E7EB] sticky top-0 bg-white flex justify-between">
              <h2 className="text-xl font-bold">Mağazanı Redaktə Et</h2>
              <button onClick={() => setShowEditForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-[#6B7280] mb-2">Loqo</label><div className="flex items-center gap-4"><div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed">{editData.logo ? <img src={editData.logo} className="w-full h-full object-cover" /> : <Store className="text-gray-400" />}</div><input ref={logoInputRef} type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "logo")} className="hidden" /><Button variant="secondary" onClick={() => logoInputRef.current?.click()} icon={<Image className="w-4 h-4" />}>Yüklə</Button></div></div>
              <div><label className="block text-sm font-medium text-[#6B7280] mb-2">Banner</label><div className="h-32 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed">{editData.banner ? <img src={editData.banner} className="w-full h-full object-cover" /> : <Image className="text-gray-400" />}</div><input ref={bannerInputRef} type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "banner")} className="hidden" /><Button variant="secondary" size="sm" className="mt-2" onClick={() => bannerInputRef.current?.click()} icon={<Image className="w-4 h-4" />}>Yüklə</Button></div>
              <div><label className="block text-sm font-medium text-[#6B7280] mb-2">Ad *</label><Input value={editData.name} onChange={(v) => setEditData({...editData, name: v})} /></div>
              <div><label className="block text-sm font-medium text-[#6B7280] mb-2">Təsvir *</label><textarea value={editData.description} onChange={(e) => setEditData({...editData, description: e.target.value})} className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg" rows={3} /></div>
              <div className="grid md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-[#6B7280] mb-2">Ünvan *</label><Input value={editData.address} onChange={(v) => setEditData({...editData, address: v})} /></div><div><label className="block text-sm font-medium text-[#6B7280] mb-2">Telefon *</label><Input value={editData.phone} onChange={(v) => setEditData({...editData, phone: v})} /></div></div>
              <div><label className="block text-sm font-medium text-[#6B7280] mb-2">Email</label><Input value={editData.email} onChange={(v) => setEditData({...editData, email: v})} /></div>
              <div><label className="block text-sm font-medium text-[#6B7280] mb-2">Kateqoriyalar</label><div className="flex flex-wrap gap-2">{categories.map(c => <button key={c} onClick={() => setEditData(p => ({...p, categories: p.categories.includes(c) ? p.categories.filter(x=>x!==c) : [...p.categories, c]}))} className={`px-4 py-2 rounded-lg text-sm font-medium ${editData.categories.includes(c) ? "bg-[#D90429] text-white" : "bg-gray-100 text-[#6B7280]"}`}>{c}</button>)}</div></div>
            </div>
            <div className="p-6 border-t border-[#E5E7EB] flex gap-4 sticky bottom-0 bg-white">
              <Button onClick={handleSubmit} disabled={submitting} icon={submitting ? <Loader2 className="animate-spin" /> : <CheckCircle />}>{submitting ? "Göndərilir..." : "Yadda Saxla"}</Button>
              <Button variant="ghost" onClick={() => setShowEditForm(false)}>Ləğv Et</Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}