"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/authApi";
import { vendorProducts, type VendorProduct } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import { 
  Package, Plus, Trash2, Edit, Save, X, Image, Loader2, ArrowLeft, Tag 
} from "lucide-react";
import Link from "next/link";

export default function StoreProductsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    unit: "m²" as "m²" | "ədəd" | "metr",
    stock: "0",
    images: [] as string[],
  });

  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    loadProducts(currentUser.id);
  }, [router]);

  const loadProducts = (vendorId: string) => {
    setLoading(true);
    try {
      const all = vendorProducts.getAll();
      const myProducts = all.filter(p => p.vendorId === vendorId);
      setProducts(myProducts);
    } catch (error) {
      console.error("[StoreProducts] Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name || !formData.price) return;

    setSubmitting(true);
    try {
      const productData = {
        vendorId: user.id,
        storeId: user.storeId || "temp-store", // Заглушка, если storeId нет
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        unit: formData.unit,
        stock: parseInt(formData.stock) || 0,
        images: formData.images,
        isActive: true,
      };

      if (editingId) {
        vendorProducts.update(editingId, productData);
      } else {
        vendorProducts.create(productData);
      }
      
      loadProducts(user.id);
      setShowForm(false);
      setEditingId(null);
      resetForm();
    } catch (error: any) {
      console.error("[StoreProducts] Save error:", error);
      alert("Xəta baş verdi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Bu məhsulu silmək istədiyinizə əminsiniz?")) return;
    try {
      vendorProducts.delete(id);
      if (user) loadProducts(user.id);
    } catch (error) {
      console.error("[StoreProducts] Delete error:", error);
    }
  };

  const handleEdit = (product: VendorProduct) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price.toString(),
      unit: product.unit,
      stock: product.stock.toString(),
      images: product.images,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: "", description: "", category: "", price: "", unit: "m²", stock: "0", images: []
    });
  };

  const categories = ["Vinil Banner", "Orakal", "Laminasiya", "Karton", "Plexi", "Dizayn", "UV Çap", "Loqotip", "Banner", "İşıqlı Qutu"];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E5E7EB] border-t-[#D90429] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#1F2937]">Məhsullarım</h1>
            <p className="text-xs text-[#6B7280]">Mağaza idarəetməsi</p>
          </div>
          <div className="ml-auto">
            <Button onClick={() => { setShowForm(true); resetForm(); }} icon={<Plus className="w-4 h-4" />}>
              Yeni Məhsul
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          
          {/* Форма добавления/редактирования */}
          {showForm && (
            <Card className="p-6 mb-6 border-2 border-[#D90429]">
              <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
                {editingId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingId ? "Məhsulu Redaktə Et" : "Yeni Məhsul Əlavə Et"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#6B7280] mb-1">Adı *</label>
                    <Input value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6B7280] mb-1">Kateqoriya</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-12 px-4 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                    >
                      <option value="">Seçin</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6B7280] mb-1">Qiymət (AZN) *</label>
                    <Input type="number" step="0.01" value={formData.price} onChange={(v) => setFormData({ ...formData, price: v })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6B7280] mb-1">Vahid</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                      className="w-full h-12 px-4 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                    >
                      <option value="m²">m²</option>
                      <option value="ədəd">ədəd</option>
                      <option value="metr">metr</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6B7280] mb-1">Stok</label>
                    <Input type="number" value={formData.stock} onChange={(v) => setFormData({ ...formData, stock: v })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6B7280] mb-1">Təsvir</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" loading={submitting} icon={<Save className="w-4 h-4" />}>Yadda saxla</Button>
                  <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }} icon={<X className="w-4 h-4" />}>Ləğv et</Button>
                </div>
              </form>
            </Card>
          )}

          {/* Список товаров */}
          {products.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#1F2937] mb-2">Məhsul yoxdur</h3>
              <p className="text-[#6B7280] mb-6">İlk məhsulunuzu əlavə edin</p>
              <Button onClick={() => { setShowForm(true); resetForm(); }} icon={<Plus className="w-4 h-4" />}>
                Məhsul Əlavə Et
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="p-5 relative group">
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(product)} className="p-2 text-blue-500 hover:bg-blue-50 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-[#D90429]/10 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-[#D90429]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#1F2937]">{product.name}</h3>
                      {product.category && (
                        <span className="text-xs bg-gray-100 text-[#6B7280] px-2 py-0.5 rounded inline-flex items-center gap-1">
                          <Tag className="w-3 h-3" /> {product.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-[#6B7280] mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
                    <div>
                      <span className="text-xl font-bold text-[#D90429]">{product.price} AZN</span>
                      <span className="text-xs text-[#6B7280]">/{product.unit}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {product.stock > 0 ? `Stokda: ${product.stock}` : "Tükənib"}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}