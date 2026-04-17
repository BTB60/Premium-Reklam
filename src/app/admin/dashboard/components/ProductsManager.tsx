// src/app/admin/dashboard/components/ProductsManager.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Search, Plus, Edit, Trash2, Save, X, Package, AlertCircle, RefreshCw, Wallet } from "lucide-react";
import { productApi, type Product as ApiProduct } from "@/lib/authApi";

// 🔗 Локальный интерфейс, расширенный для совместимости
interface Product extends Omit<ApiProduct, 'id'> {
  id: string | number;
  unitPrice?: number;
  costPrice?: number; // ✅ Maya dəyəri (себестоимость)
}

const CATEGORIES = [
  "Banner", "Vinil", "Poster", "Kətan", "Oracal", "Digiflex", "Laminat"
];

export default function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formError, setFormError] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [costPrice, setCostPrice] = useState(""); // ✅ Maya dəyəri
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [status, setStatus] = useState("active");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productApi.getAll();
      const normalized = data.map(p => ({ ...p, id: String(p.id) }));
      setProducts(normalized as Product[]);
    } catch (error) {
      console.error("[Products] Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setCategory("");
    setUnitPrice("0");
    setCostPrice(""); // ✅ Сброс себестоимости
    setWidth("");
    setHeight("");
    setStatus("active");
    setDescription("");
    setImageUrl("");
    setFormError("");
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setCategory(product.category || "");
    const price = (product as any).unitPrice ?? (product as any).salePrice ?? (product as any).basePrice ?? 0;
    setUnitPrice(String(price));
    // ✅ Заполнение поля себестоимости
    setCostPrice(product.costPrice !== undefined && product.costPrice !== null ? String(product.costPrice) : "");
    setWidth(product.width !== undefined && product.width !== null ? String(product.width) : "");
    setHeight(product.height !== undefined && product.height !== null ? String(product.height) : "");
    const s = (product as any).status?.toLowerCase() || "active";
    const isActive = (product as any).isActive !== false;
    setStatus(isActive ? "active" : (s === "inactive" ? "inactive" : "active"));
    setDescription(product.description || "");
    setImageUrl((product as any).imageUrl || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Ad tələb olunur");
      return;
    }

    const priceValue = parseFloat(unitPrice);
    const finalPrice = isNaN(priceValue) || priceValue < 0 ? 0 : priceValue;
    
    // ✅ Обработка себестоимости
    const costValue = costPrice === "" ? undefined : parseFloat(costPrice);
    const finalCost = costValue !== undefined && !isNaN(costValue) && costValue >= 0 ? costValue : undefined;
    
    const widthValue = width === "" ? undefined : parseFloat(width);
    const heightValue = height === "" ? undefined : parseFloat(height);
    const isActive = status === "active";

    const payload = {
      name: name.trim(),
      description: description.trim() || "",
      category: category.trim() || "Banner",
      basePrice: finalPrice,
      salePrice: finalPrice,
      unitPrice: finalPrice,
      costPrice: finalCost, // ✅ Добавляем себестоимость в payload
      width: widthValue,
      height: heightValue,
      isActive: isActive,
      status: isActive ? "ACTIVE" : "INACTIVE",
      imageUrl: imageUrl.trim() || "",
    };

    try {
      let savedProduct;
      if (editingId) {
        savedProduct = await productApi.update(editingId, payload);
      } else {
        savedProduct = await productApi.create(payload);
      }

      await loadProducts();
      
      setShowForm(false);
      setEditingId(null);
      resetForm();
      setFormError("Yadda saxlandı: " + finalPrice + " AZN");
      
      setTimeout(() => setFormError(""), 3000);

    } catch (error: any) {
      console.error("[Products] Save error:", error);
      setFormError(error.message || "Xəta baş verdi");
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Məhsulu silmək istədiyinizə əminsiniz?")) return;
    
    try {
      await productApi.delete(id);
      await loadProducts();
    } catch (error) {
      console.error("[Products] Delete error:", error);
      const updated = products.filter(p => String(p.id) !== String(id));
      setProducts(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem("decor_products", JSON.stringify(updated));
      }
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    const pStatus = (p as any).status?.toLowerCase() || ((p as any).isActive === false ? "inactive" : "active");
    const matchesStatus = statusFilter === "all" || pStatus === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // ✅ Хелпер для расчёта маржи (для отображения в таблице)
  const getMargin = (p: Product) => {
    const sale = (p as any).salePrice ?? (p as any).basePrice ?? (p as any).unitPrice ?? 0;
    const cost = p.costPrice ?? 0;
    if (sale <= 0) return null;
    const margin = ((sale - cost) / sale) * 100;
    return Math.round(margin * 100) / 100;
  };

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
          <Package className="w-8 h-8 text-[#D90429]" />
          <h1 className="text-2xl font-bold text-[#1F2937]">Məhsullar</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadProducts} variant="ghost" size="sm" icon={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}>
            Yenilə
          </Button>
          <Button onClick={() => { setShowForm(true); resetForm(); }} icon={<Plus className="w-4 h-4" />}>
            Yeni məhsul
          </Button>
        </div>
      </div>

      <Card className="p-4 mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Axtar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          >
            <option value="all">Bütün kateqoriyalar</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          >
            <option value="all">Bütün statuslar</option>
            <option value="active">Aktiv</option>
            <option value="inactive">Qeyri-aktiv</option>
            <option value="draft">Qaralama</option>
          </select>
          <div className="text-right text-sm text-[#6B7280] flex items-center justify-end">
            Nəticə: {filteredProducts.length}
          </div>
        </div>
      </Card>

      {showForm && (
        <Card className="p-6 mb-6 border-2 border-[#D90429]">
          <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            {editingId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingId ? "Məhsulu redaktə et" : "Yeni məhsul əlavə et"}
          </h3>
          
          {formError && (
            <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${formError.includes('Xəta') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              <AlertCircle className="w-4 h-4" />
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Ad *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Kateqoriya</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                >
                  <option value="">Seçin (default: Banner)</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              
              {/* ✅ Цена продажи */}
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Satış qiyməti (AZN) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                  required
                />
              </div>
              
              {/* ✅ Maya dəyəri (себестоимость) */}
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5" />
                  Maya dəyəri (AZN)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429] bg-gray-50"
                  placeholder="Opsional"
                />
                <p className="text-[10px] text-[#9CA3AF] mt-1">
                  Mənfəət hesablamaq üçün (məs: {unitPrice ? (parseFloat(unitPrice) * 0.7).toFixed(2) : "0.00"} AZN)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                >
                  <option value="active">Aktiv</option>
                  <option value="inactive">Qeyri-aktiv</option>
                  <option value="draft">Qaralama</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">En (m)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Hündürlük (m)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Təsvir</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Şəkil URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                />
                {imageUrl && (
                  <img src={imageUrl} alt="" className="w-10 h-10 object-cover rounded border" />
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" icon={<Save className="w-4 h-4" />}>Yadda saxla</Button>
              <Button
                variant="ghost"
                onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }}
                icon={<X className="w-4 h-4" />}
              >
                Ləğv et
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Məhsul</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Kateqoriya</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Ölçü</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Satış</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Maya</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Marja</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#6B7280]">
                  Məhsul tapılmadı
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const salePrice = (product as any).salePrice ?? (product as any).basePrice ?? (product as any).unitPrice ?? 0;
                const cost = product.costPrice ?? 0;
                const margin = getMargin(product);
                
                return (
                  <tr key={String(product.id)} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {(product as any).imageUrl && (
                          <img src={(product as any).imageUrl} alt="" className="w-10 h-10 object-cover rounded" />
                        )}
                        <div>
                          <p className="font-medium text-[#1F2937]">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-[#6B7280] line-clamp-1">{product.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        {product.category || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#6B7280]">
                      {product.width && product.height 
                        ? `${product.width} × ${product.height} m²` 
                        : "-"}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#1F2937]">
                      {salePrice.toFixed(2)} AZN
                    </td>
                    <td className="py-3 px-4 text-sm text-[#6B7280]">
                      {product.costPrice !== undefined && product.costPrice !== null 
                        ? <span className="font-medium">{product.costPrice.toFixed(2)} AZN</span> 
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className="py-3 px-4">
                      {margin !== null ? (
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          margin >= 50 ? "bg-green-100 text-green-700" :
                          margin >= 30 ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {margin}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={(product as any).status?.toLowerCase() || ((product as any).isActive === false ? "inactive" : "active")} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                          title="Redaktə"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}