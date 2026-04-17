"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/authApi";
import { storeRequests, vendorStores, vendorProducts, type StoreRequest, type VendorStore } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import { 
  Store, Plus, CheckCircle, Clock, XCircle, ArrowLeft, MapPin, Phone, 
  Mail, Tag, Loader2, Edit, Image, X, Package, Eye 
} from "lucide-react";
import Link from "next/link";

export default function MyStorePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [myStore, setMyStore] = useState<VendorStore | null>(null);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [myRequest, setMyRequest] = useState<StoreRequest | null>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  
  const [editData, setEditData] = useState({
    name: "", description: "", address: "", phone: "", email: "",
    logo: "", banner: "", categories: [] as string[],
  });

  const [formData, setFormData] = useState({
    name: "", description: "", address: "", phone: "", email: "", categories: [] as string[],
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const currentUser = authApi.getCurrentUser() as any;
    if (!currentUser) { router.push("/login"); return; }
    setUser(currentUser);
    refreshData(currentUser.id);
  }, [router]);

  // ✅ Централизованная функция загрузки данных
  const refreshData = (userId: string) => {
    const store = vendorStores.getByVendorId(userId);
    if (store?.isApproved) {
      setMyStore(store);
      setMyProducts(vendorProducts.getByVendorId(userId));
      setEditData({
        name: store.name, description: store.description, address: store.address,
        phone: store.phone, email: store.email || "", logo: store.logo || "",
        banner: store.banner || "", categories: store.category || [],
      });
    } else {
      setMyStore(null);
      setMyProducts([]);
    }

    const request = storeRequests.getByVendorId(userId);
    if (request && (request.status === "pending" || request.status === "rejected")) {
      setMyRequest(request);
    } else {
      setMyRequest(null);
    }
    setLoading(false);
  };

  const categories = ["Vinil Banner", "Orakal", "Laminasiya", "Karton", "Plexi", "Dizayn", "UV Çap", "Loqotip", "Banner", "İşıqlı Qutu"];

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category) ? prev.categories.filter(c => c !== category) : [...prev.categories, category]
    }));
  };

  // ✅ ИСПРАВЛЕНИЕ: Агрессивная очистка перед новой заявкой
  const handleNewApplicationAfterDeletion = () => {
    if (typeof window !== "undefined" && user) {
      console.log("🧹 Starting cleanup for user:", user.id);

      // 1. Удаляем ВСЕ заявки пользователя (чтобы снять блок "pending request exists")
      try {
        const rawReqs = localStorage.getItem("decor_store_requests");
        if (rawReqs) {
          const reqs: any[] = JSON.parse(rawReqs);
          const filtered = reqs.filter(r => r.vendorId !== user.id);
          localStorage.setItem("decor_store_requests", JSON.stringify(filtered));
          console.log("✅ Cleared store requests");
        }
      } catch (e) { console.error("Req clean error", e); }

      // 2. Удаляем старый магазин
      try {
        const rawStores = localStorage.getItem("decor_vendor_stores");
        if (rawStores && myStore) {
          const stores: any[] = JSON.parse(rawStores);
          const filtered = stores.filter(s => s.id !== myStore.id);
          localStorage.setItem("decor_vendor_stores", JSON.stringify(filtered));
          console.log("✅ Cleared old store");
        }
      } catch (e) { console.error("Store clean error", e); }
    }

    // 3. Сбрасываем стейт
    setMyStore(null);
    setMyProducts([]);
    setMyRequest(null); // Важно: убираем заявку из стейта
    setShowForm(true);
    setFormData({ name: "", description: "", address: "", phone: "", email: "", categories: [] });
    setFormError("");
  };

  // ✅ ОТПРАВКА ЗАЯВКИ
  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.address.trim() || !formData.phone.trim()) {
      return setFormError("Bütün vacib sahələri doldurun");
    }
    if (formData.categories.length === 0) return setFormError("Ən azı bir kateqoriya seçin");
    
    setSubmitting(true);
    setFormError("");
    
    try {
      storeRequests.create({
        vendorId: user.id,
        vendorName: user.fullName,
        vendorPhone: user.phone || "",
        name: formData.name.trim(),
        description: formData.description.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || user.email || "",
        category: formData.categories,
      });

      // Обновляем данные
      refreshData(user.id);
      setShowForm(false);
      
      alert("Sizin müraciətiniz Administratora göndərilmişdir.");
    } catch (error: any) {
      console.error(error);
      // Если всё еще ошибка дубликата — значит очистка не прошла, пробуем еще раз жестче
      if (error.message.includes("artıq gözləyən")) {
        handleNewApplicationAfterDeletion();
        setFormError("Köhnə müraciət silindi. Yenidən cəhd edin.");
      } else {
        setFormError(error.message || "Xəta baş verdi");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#E5E7EB] border-t-[#D90429] rounded-full animate-spin" /></div>;
  if (!user) return null;

  // 🔴 1. Магазин удалён админом
  if (myStore && !myStore.isActive) {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
            <div><h1 className="text-lg font-bold text-[#1F2937]">Mağazam</h1><p className="text-xs text-[#6B7280]">Marketplace</p></div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-8 text-center border-2 border-red-200 bg-red-50">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-red-700 mb-4">Mağaza Ləğv Edilmişdir</h2>
              <div className="bg-white rounded-xl p-6 mb-6 text-left shadow-sm">
                <p className="text-[#1F2937] font-medium mb-2">
                  Sizin <span className="font-bold">"{myStore.name}"</span> mağazanız Administrator tərəfindən ləğv edilmişdir.
                </p>
                <p className="text-[#6B7280] text-sm mb-4">
                  Ətraflı məlumat və səbəb üçün <strong>Bildirişlər</strong> bölməsinə baxın.
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <Link href="/dashboard"><Button variant="secondary">Dashboard-a Qayıt</Button></Link>
                <Button onClick={handleNewApplicationAfterDeletion} icon={<Plus className="w-4 h-4" />}>
                  Yeni Müraciət
                </Button>
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }

  // ✅ 2. Магазин активен
  if (myStore && myStore.isActive) {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
            <div className="flex-1"><h1 className="text-lg font-bold text-[#1F2937]">Mağazam</h1><p className="text-xs text-[#6B7280]">Marketplace</p></div>
            <div className="flex gap-2">
              <Link href="/dashboard/store/products"><Button variant="secondary" icon={<Package className="w-4 h-4" />}>Məhsullar</Button></Link>
              <Button onClick={() => setShowEditForm(true)} icon={<Edit className="w-4 h-4" />}>Redaktə Et</Button>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-6">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
             <div className="relative mb-8">
               <div className="h-48 bg-gradient-to-r from-[#D90429] to-[#EF476F] rounded-2xl overflow-hidden">
                 {myStore.banner ? <img src={myStore.banner} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Store className="w-16 h-16 text-white/30" /></div>}
               </div>
               <div className="absolute -bottom-12 left-8">
                 <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center overflow-hidden border-4 border-white">
                   {myStore.logo ? <img src={myStore.logo} alt="" className="w-full h-full object-cover" /> : <Store className="w-12 h-12 text-[#D90429]" />}
                 </div>
               </div>
             </div>
             <div className="ml-36 mb-6">
               <div className="flex items-center gap-3 mb-2"><h2 className="text-2xl font-bold text-[#1F2937]">{myStore.name}</h2><span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">Aktiv</span></div>
               <p className="text-[#6B7280]">{myStore.description}</p>
             </div>
             <div className="grid md:grid-cols-3 gap-6 mb-6">
               <Card className="p-6"><div className="flex items-center gap-4"><MapPin className="w-6 h-6 text-[#D90429]" /><div><p className="text-sm text-[#6B7280]">Ünvan</p><p className="font-medium">{myStore.address}</p></div></div></Card>
               <Card className="p-6"><div className="flex items-center gap-4"><Phone className="w-6 h-6 text-[#D90429]" /><div><p className="text-sm text-[#6B7280]">Telefon</p><p className="font-medium">{myStore.phone}</p></div></div></Card>
               <Card className="p-6"><div className="flex items-center gap-4"><Mail className="w-6 h-6 text-[#D90429]" /><div><p className="text-sm text-[#6B7280]">Email</p><p className="font-medium">{myStore.email || "-"}</p></div></div></Card>
             </div>
             <Card className="p-6 mb-6"><h3 className="font-bold text-[#1F2937] mb-4">Kateqoriyalar</h3><div className="flex flex-wrap gap-2">{myStore.category.map((cat: string, idx: number) => <span key={idx} className="px-4 py-2 bg-[#D90429]/10 text-[#D90429] rounded-full text-sm font-medium">{cat}</span>)}</div></Card>
             <div className="mt-6 flex gap-4"><Link href={`/store/${myStore.id}`}><Button icon={<Eye className="w-4 h-4" />}>Mağazaya Bax</Button></Link></div>
           </motion.div>
        </main>
        {/* Edit Modal */}
        {showEditForm && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><Card className="w-full max-w-lg p-6"><h2 className="text-xl font-bold mb-4">Redaktə Et</h2><div className="space-y-4"><Input value={editData.name} onChange={v=>setEditData({...editData, name:v})} placeholder="Ad" /><textarea value={editData.description} onChange={e=>setEditData({...editData, description:e.target.value})} className="w-full p-3 border rounded" rows={3} placeholder="Təsvir" /></div><div className="flex gap-2 mt-4"><Button onClick={()=>setShowEditForm(false)}>Bağla</Button></div></Card></div>}
      </div>
    );
  }

  // ⏳ 3. Заявка ожидает
  if (myRequest && myRequest.status === "pending") {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
            <div><h1 className="text-lg font-bold text-[#1F2937]">Mağaza Müraciəti</h1><p className="text-xs text-[#6B7280]">Marketplace</p></div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-6 mb-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
              <div className="flex items-center gap-4"><div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center"><Clock className="w-8 h-8" /></div><div><h2 className="text-2xl font-bold">Gözləyən Müraciət</h2><p className="opacity-90">Admin təsdiqini gözləyir</p></div></div>
            </Card>
            <Card className="p-6">
              <h3 className="font-bold mb-4">Detalları</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Ad:</strong> {myRequest.name}</p>
                <p><strong>Təsvir:</strong> {myRequest.description}</p>
                <p><strong>Ünvan:</strong> {myRequest.address}</p>
                <p><strong>Kateqoriyalar:</strong> {myRequest.category.join(", ")}</p>
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }

  // ❌ 4. Заявка отклонена
  if (myRequest && myRequest.status === "rejected") {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
            <div><h1 className="text-lg font-bold text-[#1F2937]">Mağaza Müraciəti</h1><p className="text-xs text-[#6B7280]">Marketplace</p></div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-6 mb-6 bg-gradient-to-r from-red-500 to-red-600 text-white">
              <div className="flex items-center gap-4"><div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center"><XCircle className="w-8 h-8" /></div><div><h2 className="text-2xl font-bold">Rədd Edildi</h2></div></div>
            </Card>
            {myRequest.rejectionReason && <Card className="p-6 mb-6 bg-red-50 border border-red-200"><p className="text-red-700">Səbəb: {myRequest.rejectionReason}</p></Card>}
            <Button onClick={handleNewApplicationAfterDeletion} icon={<Plus className="w-4 h-4" />}>Yenidən Müraciət Et</Button>
          </motion.div>
        </main>
      </div>
    );
  }

  // ➕ 5. Форма создания (по умолчанию)
  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div><h1 className="text-lg font-bold text-[#1F2937]">Marketplace-də Mağaza Aç</h1><p className="text-xs text-[#6B7280]">Öz mağazanızı yaradın</p></div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="p-6 mb-6 bg-gradient-to-r from-[#D90429] to-[#EF476F] text-white">
            <div className="flex items-start gap-4"><div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0"><Store className="w-6 h-6" /></div><div><h3 className="text-xl font-bold mb-2">Marketplace-də Öz Mağazanızı Yaradın</h3><p className="opacity-90 text-sm">Müraciət edin, admin təsdiqlədikdən sonra mağazanız aktiv olacaq.</p></div></div>
          </Card>
          {showForm ? (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Mağaza Məlumatları</h2>
              {formError && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{formError}</div>}
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                <div><label className="block text-sm font-medium text-[#6B7280] mb-2">Mağaza Adı *</label><Input placeholder="Məs: Premium Reklam" value={formData.name} onChange={(v) => setFormData({...formData, name: v})} /></div>
                <div><label className="block text-sm font-medium text-[#6B7280] mb-2">Təsvir *</label><textarea placeholder="Mağazanız haqqında..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 border rounded-lg" rows={3} /></div>
                <div><label className="block text-sm font-medium text-[#6B7280] mb-2">Ünvan *</label><Input placeholder="Bakı..." value={formData.address} onChange={(v) => setFormData({...formData, address: v})} /></div>
                <div className="grid md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-[#6B7280] mb-2">Telefon *</label><Input placeholder="050..." value={formData.phone} onChange={(v) => setFormData({...formData, phone: v})} /></div><div><label className="block text-sm font-medium text-[#6B7280] mb-2">Email</label><Input placeholder="email@..." value={formData.email} onChange={(v) => setFormData({...formData, email: v})} /></div></div>
                <div><label className="block text-sm font-medium text-[#6B7280] mb-2">Kateqoriyalar *</label><div className="flex flex-wrap gap-2">{categories.map((c) => (<button key={c} type="button" onClick={() => toggleCategory(c)} className={`px-4 py-2 rounded-lg text-sm font-medium ${formData.categories.includes(c) ? "bg-[#D90429] text-white" : "bg-gray-100 text-[#6B7280]"}`}>{c}</button>))}</div></div>
                <div className="flex gap-4 mt-6"><Button type="submit" disabled={submitting} icon={submitting ? <Loader2 className="animate-spin" /> : <CheckCircle />}>{submitting ? "Göndərilir..." : "Müraciət Et"}</Button><Button variant="ghost" onClick={() => setShowForm(false)}>Ləğv Et</Button></div>
              </form>
            </Card>
          ) : (
            <Card className="p-12 text-center"><div className="w-20 h-20 bg-[#D90429]/10 rounded-full flex items-center justify-center mx-auto mb-6"><Store className="w-10 h-10 text-[#D90429]" /></div><h2 className="text-xl font-bold mb-2">Hələ mağazanız yoxdur</h2><p className="text-[#6B7280] mb-6">Marketplace-də öz mağazanızı açın</p><Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>Mağaza Aç</Button></Card>
          )}
        </motion.div>
      </main>
    </div>
  );
}