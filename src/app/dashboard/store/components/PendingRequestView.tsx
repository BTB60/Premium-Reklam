"use client";
import { useState } from "react";
import { getVendorStoreCategoryOptions, normalizeVendorStoreCategories } from "@/lib/vendorStoreCategories";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Clock, Store, FileText, MapPin, Phone, Mail, Tag, Edit, X, CheckCircle, Loader2 } from "lucide-react";
import type { StoreRequest } from "@/lib/db";

export default function PendingRequestView({ 
  request, 
  onUpdate 
}: { 
  request: StoreRequest; 
  onUpdate: (data: any) => Promise<boolean>; 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: request.name,
    description: request.description,
    address: request.address,
    phone: request.phone,
    email: request.email || "",
    categories: normalizeVendorStoreCategories(request.category),
  });

  const categories = getVendorStoreCategoryOptions();

  const handleSubmit = async () => {
    setSubmitting(true);
    const success = await onUpdate({
      ...formData,
      categories: normalizeVendorStoreCategories(formData.categories),
    });
    if (success) setIsEditing(false);
    setSubmitting(false);
  };

  if (isEditing) {
    return (
      <Card className="p-6">
        <div className="flex justify-between mb-4"><h2 className="text-xl font-bold">Müraciəti Redaktə Et</h2><button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button></div>
        <div className="space-y-4">
          <div><label className="block text-sm text-[#6B7280] mb-2">Ad *</label><Input value={formData.name} onChange={(v) => setFormData({...formData, name: v})} /></div>
          <div><label className="block text-sm text-[#6B7280] mb-2">Təsvir *</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 border rounded-lg" rows={3} /></div>
          <div className="grid md:grid-cols-2 gap-4"><div><label className="block text-sm text-[#6B7280] mb-2">Ünvan *</label><Input value={formData.address} onChange={(v) => setFormData({...formData, address: v})} /></div><div><label className="block text-sm text-[#6B7280] mb-2">Telefon *</label><Input value={formData.phone} onChange={(v) => setFormData({...formData, phone: v})} /></div></div>
          <div><label className="block text-sm text-[#6B7280] mb-2">Email</label><Input value={formData.email} onChange={(v) => setFormData({...formData, email: v})} /></div>
          <div><label className="block text-sm text-[#6B7280] mb-2">Kateqoriyalar</label><div className="flex flex-wrap gap-2">{categories.map(c => <button key={c} onClick={() => setFormData(p => ({...p, categories: p.categories.includes(c) ? p.categories.filter(x=>x!==c) : [...p.categories, c]}))} className={`px-4 py-2 rounded-lg text-sm font-medium ${formData.categories.includes(c) ? "bg-[#D90429] text-white" : "bg-gray-100 text-[#6B7280]"}`}>{c}</button>)}</div></div>
        </div>
        <div className="mt-6 flex gap-4"><Button onClick={handleSubmit} disabled={submitting} icon={submitting ? <Loader2 className="animate-spin" /> : <CheckCircle />}>Yenilə</Button><Button variant="ghost" onClick={() => setIsEditing(false)}>Ləğv</Button></div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
        <div className="flex items-center gap-4"><div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center"><Clock className="w-8 h-8" /></div><div><h2 className="text-2xl font-bold">Gözləyən Müraciət</h2><p className="opacity-90">Admin təsdiqini gözləyir</p></div></div>
      </Card>
      <div className="flex justify-end"><Button variant="secondary" onClick={() => setIsEditing(true)} icon={<Edit className="w-4 h-4" />}>Müraciəti Redaktə Et</Button></div>
      <Card className="p-6">
        <h3 className="font-bold mb-4">Detalları</h3>
        <div className="space-y-4">
          <div className="flex gap-3"><Store className="w-5 h-5 text-[#6B7280] mt-0.5" /><div><p className="text-sm text-[#6B7280]">Ad</p><p className="font-medium">{request.name}</p></div></div>
          <div className="flex gap-3"><FileText className="w-5 h-5 text-[#6B7280] mt-0.5" /><div><p className="text-sm text-[#6B7280]">Təsvir</p><p className="font-medium">{request.description}</p></div></div>
          <div className="flex gap-3"><MapPin className="w-5 h-5 text-[#6B7280] mt-0.5" /><div><p className="text-sm text-[#6B7280]">Ünvan</p><p className="font-medium">{request.address}</p></div></div>
          <div className="flex gap-3"><Phone className="w-5 h-5 text-[#6B7280] mt-0.5" /><div><p className="text-sm text-[#6B7280]">Telefon</p><p className="font-medium">{request.phone}</p></div></div>
          <div className="flex gap-3"><Mail className="w-5 h-5 text-[#6B7280] mt-0.5" /><div><p className="text-sm text-[#6B7280]">Email</p><p className="font-medium">{request.email || "-"}</p></div></div>
          <div className="flex gap-3"><Tag className="w-5 h-5 text-[#6B7280] mt-0.5" /><div><p className="text-sm text-[#6B7280]">Kateqoriyalar</p><div className="flex flex-wrap gap-2 mt-1">{request.category.map((c: string, i: number) => <span key={i} className="px-3 py-1 bg-[#D90429]/10 text-[#D90429] rounded-full text-xs font-medium">{c}</span>)}</div></div></div>
        </div>
      </Card>
    </div>
  );
}