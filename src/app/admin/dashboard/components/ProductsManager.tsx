"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { 
  Search, Plus, Edit, Trash2, Save, X, Package, AlertCircle
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  description?: string;
  category: string;
  unitPrice?: number;
  width?: number;
  height?: number;
  status: "active" | "inactive" | "draft";
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  color?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "https://premium-reklam-backend.onrender.com/api";

const DEFAULT_CATEGORIES: ProductCategory[] = [
  { id: 1, name: "Banner", color: "bg-blue-100 text-blue-700" },
  { id: 2, name: "Vinil", color: "bg-green-100 text-green-700" },
  { id: 3, name: "Poster", color: "bg-purple-100 text-purple-700" },
  { id: 4, name: "Kətan", color: "bg-amber-100 text-amber-700" },
  { id: 5, name: "Oracal", color: "bg-pink-100 text-pink-700" },
  { id: 6, name: "Digiflex", color: "bg-cyan-100 text-cyan-700" },
  { id: 7, name: "Laminat", color: "bg-indigo-100 text-indigo-700" },
];

export default function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    category: "",
    unitPrice: 0,
    width: undefined,
    height: undefined,
    status: "active",
    imageUrl: "",
  });

  // 🔥 Для ввода чисел с десятичной точкой (0.6)
  const [widthInput, setWidthInput] = useState<string>("");
  const [heightInput, setHeightInput] = useState<string>("");
  const [priceInput, setPriceInput] = useState<string>("");

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    // 🔥 Синхронизируем input-ы с formData при открытии формы
    if (showForm) {
      setWidthInput(formData.width !== undefined ? String(formData.width) : "");
      setHeightInput(formData.height !== undefined ? String(formData.height) : "");
      setPriceInput(formData.unitPrice !== undefined ? String(formData.unitPrice) : "0");
    }
  }, [showForm, formData.width, formData.height, formData.unitPrice]);

  const getToken = () => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("decor_current_user");
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed?.token || null;
    } catch {
      return null;
    }
  };

  const loadProducts = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/products`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.products || [];
        setProducts(list);
        localStorage.setItem("decor_products", JSON.stringify(list));
      }
    } catch (error) {
      console.error("[Products] Load error:", error);
      try {
        const stored = localStorage.getItem("decor_products");
        if (stored) setProducts(JSON.parse(stored));
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/products/categories`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.categories || [];
        if (list.length > 0) {
          setCategories(list);
        }
      }
    } catch (error) {
      console.warn("[Products] Categories fetch failed, using defaults");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name) {
      setFormError("Ad tələb olunur");
      return;
    }

    // 🔥 Парсим цену из строкового input
    const priceValue = parseFloat(priceInput) || 0;

    try {
      const token = getToken();
      const method = editingId ? "PUT" : "POST";
      const url = editingId 
        ? `${API_BASE}/products/${editingId}` 
        : `${API_BASE}/products`;

      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category || "Banner",
        unitPrice: priceValue,
        width: formData.width,
        height: formData.height,
        status: formData.status || "active",
        imageUrl: formData.imageUrl,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(productData)
      });

      if (res.ok) {
        await loadProducts();
        setShowForm(false);
        setEditingId(null);
        resetForm();
      } else {
        throw new Error("API error");
      }
    } catch (error) {
      console.error("[Products] Save error:", error);
      
      // 🔥 Фолбэк: localStorage
      try {
        const productToSave: Product = {
          id: editingId || Date.now(),
          name: formData.name!,
          description: formData.description,
          category: formData.category || "Banner",
          unitPrice: parseFloat(priceInput) || 0,
          width: formData.width,
          height: formData.height,
          status: formData.status as any || "active",
          imageUrl: formData.imageUrl,
          createdAt: editingId ? products.find(p => p.id === editingId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (editingId) {
          const updated = products.map(p => 
            p.id === editingId ? productToSave : p
          );
          setProducts(updated);
          localStorage.setItem("decor_products", JSON.stringify(updated));
        } else {
          const updated = [...products, productToSave];
          setProducts(updated);
          localStorage.setItem("decor_products", JSON.stringify(updated));
        }
        setShowForm(false);
        setEditingId(null);
        resetForm();
        setFormError("Yadda saxlandı (lokal)");
      } catch (e) {
        setFormError("Xəta baş verdi");
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Məhsulu silmək istədiyinizə əminsiniz?")) return;
    
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "DELETE",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      
      if (res.ok) {
        await loadProducts();
      } else {
        throw new Error("API error");
      }
    } catch (error) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      localStorage.setItem("decor_products", JSON.stringify(updated));
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      unitPrice: product.unitPrice,
      width: product.width,
      height: product.height,
      status: product.status,
      imageUrl: product.imageUrl,
    });
    // 🔥 Устанавливаем строковые значения для input
    setPriceInput(product.unitPrice !== undefined ? String(product.unitPrice) : "0");
    setWidthInput(product.width !== undefined ? String(product.width) : "");
    setHeightInput(product.height !== undefined ? String(product.height) : "");
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      unitPrice: 0,
      width: undefined,
      height: undefined,
      status: "active",
      imageUrl: "",
    });
    setPriceInput("0");
    setWidthInput("");
    setHeightInput("");
    setFormError("");
  };

  const filteredProducts = products.filter(p => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === "active").length,
    inactive: products.filter(p => p.status === "inactive").length,
    draft: products.filter(p => p.status === "draft").length,
    avgPrice: products.length > 0 
      ? products.reduce((sum, p) => sum + (p.unitPrice || 0), 0) / products.length 
      : 0,
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
        <Button onClick={() => { setShowForm(true); resetForm(); }} icon={<Plus className="w-4 h-4" />}>
          Yeni məhsul
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-[#6B7280] text-sm">Ümumi</p>
          <p className="text-2xl font-bold text-[#1F2937]">{stats.total}</p>
        </Card>
        <Card className="p-4 bg-green-50">
          <p className="text-green-600 text-sm">Aktiv</p>
          <p className="text-2xl font-bold text-green-700">{stats.active}</p>
        </Card>
        <Card className="p-4 bg-gray-50">
          <p className="text-gray-600 text-sm">Qeyri-aktiv</p>
          <p className="text-2xl font-bold text-gray-700">{stats.inactive}</p>
        </Card>
        <Card className="p-4 bg-amber-50">
          <p className="text-amber-600 text-sm">Orta qiymət</p>
          <p className="text-2xl font-bold text-amber-700">{stats.avgPrice.toFixed(2)} AZN</p>
        </Card>
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
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
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
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
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
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Kateqoriya</label>
                <select
                  value={formData.category || ""}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                >
                  <option value="">Seçin (default: Banner)</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Qiymət (AZN) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceInput}
                  onChange={(e) => {
                    setPriceInput(e.target.value);
                    setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 });
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Status</label>
                <select
                  value={formData.status || "active"}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
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
                  value={widthInput}
                  onChange={(e) => {
                    setWidthInput(e.target.value);
                    setFormData({ ...formData, width: e.target.value === "" ? undefined : parseFloat(e.target.value) });
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Hündürlük (m)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={heightInput}
                  onChange={(e) => {
                    setHeightInput(e.target.value);
                    setFormData({ ...formData, height: e.target.value === "" ? undefined : parseFloat(e.target.value) });
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Təsvir</label>
              <textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Şəkil URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.imageUrl || ""}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                />
                {formData.imageUrl && (
                  <img src={formData.imageUrl} alt="" className="w-10 h-10 object-cover rounded border" />
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
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Qiymət</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#6B7280]">
                  Məhsul tapılmadı
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt="" className="w-10 h-10 object-cover rounded" />
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
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      categories.find(c => c.name === product.category)?.color || "bg-gray-100 text-gray-700"
                    }`}>
                      {product.category || "-"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-[#6B7280]">
                    {product.width && product.height 
                      ? `${product.width} × ${product.height} m²` 
                      : "-"}
                  </td>
                  <td className="py-3 px-4 font-bold text-[#1F2937]">
                    {(product.unitPrice || 0).toFixed(2)} AZN
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={product.status} />
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
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}