"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/authApi";
import { vendorStores, vendorProducts, type VendorProduct, type VendorStore } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import { 
  Store, 
  Plus, 
  CheckCircle, 
  Clock,
  ArrowLeft,
  Edit,
  Trash2,
  X,
  Image,
  Loader2,
  Eye,
  EyeOff,
  Tag
} from "lucide-react";
import Link from "next/link";

export default function VendorProductsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myStore, setMyStore] = useState<VendorStore | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<VendorProduct | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Vinil Banner",
    price: "",
    unit: "m²" as "m²" | "ədəd" | "metr",
    stock: "",
    images: [] as string[],
  });
  const [formError, setFormError] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    "Vinil Banner",
    "Orakal",
    "Laminasiya",
    "Karton",
    "Plexi",
    "Dizayn",
    "UV Çap",
    "Loqotip",
    "Banner",
    "İşıqlı Qutu",
  ];

  useEffect(() => {
    const currentUser = authApi.getCurrentUser() as any;

    if (!currentUser) {
      router.push("/login");
      return;
    }

    setUser(currentUser);
    
    // Check if user has approved store
    const store = vendorStores.getByVendorId(currentUser.id);
    if (!store?.isApproved) {
      router.push("/dashboard/store");
      return;
    }
    
    setMyStore(store);
    setProducts(vendorProducts.getByVendorId(currentUser.id));
    setLoading(false);
  }, [router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, base64],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "Vinil Banner",
      price: "",
      unit: "m²",
      stock: "",
      images: [],
    });
    setFormError("");
    setEditingProduct(null);
  };

  const handleEdit = (product: VendorProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price.toString(),
      unit: product.unit,
      stock: product.stock.toString(),
      images: product.images || [],
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setFormError("Məhsul adı daxil edin");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setFormError("Düzgün qiymət daxil edin");
      return;
    }
    if (!myStore) return;

    setSubmitting(true);
    setFormError("");

    try {
      if (editingProduct) {
        vendorProducts.update(editingProduct.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
          price: parseFloat(formData.price),
          unit: formData.unit,
          stock: parseInt(formData.stock) || 0,
          images: formData.images,
        });
      } else {
        vendorProducts.create({
          vendorId: user.id,
          storeId: myStore.id,
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
          price: parseFloat(formData.price),
          unit: formData.unit,
          stock: parseInt(formData.stock) || 0,
          images: formData.images,
          isActive: true,
        });
      }

      // Refresh products
      setProducts(vendorProducts.getByVendorId(user.id));
      setShowForm(false);
      resetForm();
      alert(editingProduct ? "Məhsul yeniləndi!" : "Məhsul əlavə edildi!");
    } catch (error: any) {
      setFormError(error.message || "Xəta baş verdi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (productId: string) => {
    if (confirm("Bu məhsulu silmək istədiyinizə əminsiniz?")) {
      vendorProducts.hardDelete(productId);
      setProducts(vendorProducts.getByVendorId(user.id));
    }
  };

  const handleToggleActive = (product: VendorProduct) => {
    vendorProducts.update(product.id, { isActive: !product.isActive });
    setProducts(vendorProducts.getByVendorId(user.id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E5E7EB] border-t-[#D90429] rounded-full animate-spin" />
      </div>
    );
  }

  if (!myStore) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <p>Mağaza tapılmadı</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/dashboard/store" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[#1F2937]">Məhsullarım</h1>
            <p className="text-xs text-[#6B7280]">{myStore.name}</p>
          </div>
          <Button 
            onClick={() => { resetForm(); setShowForm(true); }} 
            icon={<Plus className="w-4 h-4" />}
          >
            Yeni Məhsul
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Products Grid */}
          {products.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-20 h-20 bg-[#D90429]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Tag className="w-10 h-10 text-[#D90429]" />
              </div>
              <h2 className="text-xl font-bold text-[#1F2937] mb-2">
                Hələ məhsulunuz yoxdur
              </h2>
              <p className="text-[#6B7280] mb-6">
                Marketplace-də satış üçün məhsul əlavə edin
              </p>
              <Button onClick={() => { resetForm(); setShowForm(true); }} icon={<Plus className="w-4 h-4" />}>
                İlk Məhsulu Əlavə Et
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  {/* Product Image */}
                  <div className="aspect-video bg-gray-100 relative">
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    {!product.isActive && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Deaktiv
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-[#1F2937] line-clamp-1">{product.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        product.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {product.isActive ? "Aktiv" : "Deaktiv"}
                      </span>
                    </div>
                    
                    <p className="text-sm text-[#6B7280] line-clamp-2 mb-3">
                      {product.description || "Təsvir yoxdur"}
                    </p>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold text-[#D90429]">
                        {product.price.toFixed(2)} AZN
                      </span>
                      <span className="text-sm text-[#6B7280]">/{product.unit}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-[#6B7280] mb-4">
                      <span>Stok: {product.stock}</span>
                      <span>{product.images?.length || 0} şəkil</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEdit(product)}
                        icon={<Edit className="w-4 h-4" />}
                      >
                        Redaktə
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleToggleActive(product)}
                        icon={product.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      >
                        {product.isActive ? "Gizlət" : "Göstər"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        className="text-red-500 hover:bg-red-50"
                        icon={<Trash2 className="w-4 h-4" />}
                      >
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E5E7EB] sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#1F2937]">
                  {editingProduct ? "Məhsulu Redaktə Et" : "Yeni Məhsul Əlavə Et"}
                </h2>
                <button 
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                  {formError}
                </div>
              )}

              {/* Product Images */}
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-2">
                  Məhsul Şəkilləri
                </label>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="aspect-square relative rounded-lg overflow-hidden border">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-[#D90429] hover:text-[#D90429] transition-colors"
                  >
                    <Image className="w-8 h-8 mb-1" />
                    <span className="text-xs">Şəkil əlavə et</span>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-2">
                  Məhsul Adı *
                </label>
                <Input
                  placeholder="Məs: Vinil Banner 440g"
                  value={formData.name}
                  onChange={(value) => setFormData({...formData, name: value})}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-2">
                  Təsvir
                </label>
                <textarea
                  placeholder="Məhsul haqqında məlumat..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                  rows={3}
                />
              </div>

              {/* Category & Price */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#6B7280] mb-2">
                    Kateqoriya
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6B7280] mb-2">
                    Qiymət (AZN) *
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(value) => setFormData({...formData, price: value})}
                  />
                </div>
              </div>

              {/* Unit & Stock */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#6B7280] mb-2">
                    Vahid
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value as any})}
                    className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                  >
                    <option value="m²">m² (kvadrat metr)</option>
                    <option value="ədəd">Ədəd</option>
                    <option value="metr">Metr</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6B7280] mb-2">
                    Stok
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.stock}
                    onChange={(value) => setFormData({...formData, stock: value})}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#E5E7EB] flex gap-4 sticky bottom-0 bg-white">
              <Button 
                onClick={handleSubmit} 
                disabled={submitting}
                icon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              >
                {submitting ? "Göndərilir..." : editingProduct ? "Yadda Saxla" : "Əlavə Et"}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => { setShowForm(false); resetForm(); }}
              >
                Ləğv Et
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
