"use client";
import { useState } from "react";
import { getVendorStoreCategoryOptions } from "@/lib/vendorStoreCategories";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Store, Plus, CheckCircle, Loader2 } from "lucide-react";

export default function NewRequestView({ 
  onSubmit 
}: { 
  onSubmit: (data: any) => Promise<boolean>; 
}) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "", description: "", address: "", phone: "", email: "", categories: [] as string[]
  });

  const categories = getVendorStoreCategoryOptions();

  const handleSubmit = async () => {
    if (!formData.name.trim()) return setError("Mağaza adı daxil edin");
    if (!formData.description.trim()) return setError("Təsvir daxil edin");
    if (!formData.address.trim()) return setError("Ünvan daxil edin");
    if (!formData.phone.trim()) return setError("Telefon daxil edin");
    if (formData.categories.length === 0) return setError("Kateqoriya seçin");

    setSubmitting(true);
    setError("");
    const success = await onSubmit(formData);
    if (success) setShowForm(false);
    setSubmitting(false);
  };

  if (showForm) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Mağaza Məlumatları</h2>
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{error}</div>}
        <div className="space-y-4">
          <div><label className="block text-sm text-[#6B7280] mb-2">Ad *</label><Input value={formData.name} onChange={(v) => setFormData({...formData, name: v})} /></div>
          <div><label className="block text-sm text-[#6B7280] mb-2">Təsvir *</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 border rounded-lg" rows={3} /></div>
          <div><label className="block text-sm text-[#6B7280] mb-2">Ünvan *</label><Input value={formData.address} onChange={(v) => setFormData({...formData, address: v})} /></div>
          <div className="grid md:grid-cols-2 gap-4"><div><label className="block text-sm text-[#6B7280] mb-2">Telefon *</label><Input value={formData.phone} onChange={(v) => setFormData({...formData, phone: v})} /></div><div><label className="block text-sm text-[#6B7280] mb-2">Email</label><Input value={formData.email} onChange={(v) => setFormData({...formData, email: v})} /></div></div>
          <div><label className="block text-sm text-[#6B7280] mb-2">Kateqoriyalar</label><div className="flex flex-wrap gap-2">{categories.map(c => <button key={c} onClick={() => setFormData(p => ({...p, categories: p.categories.includes(c) ? p.categories.filter(x=>x!==c) : [...p.categories, c]}))} className={`px-4 py-2 rounded-lg text-sm font-medium ${formData.categories.includes(c) ? "bg-[#D90429] text-white" : "bg-gray-100 text-[#6B7280]"}`}>{c}</button>)}</div></div>
        </div>
        <div className="flex gap-4 mt-6"><Button onClick={handleSubmit} disabled={submitting} icon={submitting ? <Loader2 className="animate-spin" /> : <CheckCircle />}>{submitting ? "Göndərilir..." : "Müraciət Et"}</Button><Button variant="ghost" onClick={() => setShowForm(false)}>Ləğv Et</Button></div>
      </Card>
    );
  }

  return (
    <Card className="p-12 text-center">
      <div className="w-20 h-20 bg-[#D90429]/10 rounded-full flex items-center justify-center mx-auto mb-6"><Store className="w-10 h-10 text-[#D90429]" /></div>
      <h2 className="text-xl font-bold mb-2">Hələ mağazanız yoxdur</h2>
      <p className="text-[#6B7280] mb-6">Marketplace-də öz mağazanızı açın və məhsullarınızı satışa çıxarın</p>
      <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>Mağaza Aç</Button>
    </Card>
  );
}