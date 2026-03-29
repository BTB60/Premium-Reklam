"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Search, Plus, Edit, Trash2, Save, X, Package, AlertCircle } from "lucide-react";

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

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "https://premium-reklam-backend.onrender.com/api";

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [status, setStatus] = useState("active");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const getToken = () => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("decor_current_user");
    if (!stored) return null;
    try {
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
        
        // Мапим backend salePrice → frontend unitPrice
        const mapped = list.map((p: any) => ({
          ...p,
          id: p.id ? (typeof p.id === 'object' ? p.id.toString() : p.id) : Date.now(),
          unitPrice: p.salePrice !== undefined && p.salePrice !== null ? Number(p.salePrice) : 0,
          status: p.status ? p.status.toLowerCase() : "active",
        }));
        
        setProducts(mapped);
        localStorage.setItem("decor_products", JSON.stringify(mapped));
      }
    } catch (error) {
      console.error("[Products] Load error:", error);
      const stored = localStorage.getItem("decor_products");
      if (stored) setProducts(JSON.parse(stored));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setCategory("");
    setUnitPrice("0");
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
    setUnitPrice(product.unitPrice !== undefined && product.unitPrice !== null 
      ? String(product.unitPrice) 
      : "0");
    setWidth(product.width !== undefined && product.width !== null ? String(product.width) : "");
    setHeight(product.height !== undefined && product.height !== null ? String(product.height) : "");
    setStatus(product.status || "active");
    setDescription(product.description || "");
    setImageUrl(product.imageUrl || "");
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
    const finalPrice = isNaN(priceValue) ? 0 : priceValue;
    const widthValue = width === "" ? undefined : parseFloat(width);
    const heightValue = height === "" ? undefined : parseFloat(height);

    // 🔥 Мапим frontend unitPrice → backend salePrice
    // 🔥 Мапим frontend status (lower) → backend status (UPPER)
    const requestBody = {
      name: name.trim(),
      description: description.trim() || "",
      category: category.trim() || "Banner",
      salePrice: finalPrice,
      width: widthValue,
      height: heightValue,
      status: status.toUpperCase(),
      imageUrl: imageUrl.trim() || "",
    };

    try {
      const token = getToken();
      const method = editingId ? "PUT" : "POST";
      const url = editingId 
        ? `${API_BASE}/products/${editingId}` 
        : `${API_BASE}/products`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(requestBody)
      });

      const responseText = await res.text();
      
      if (res.ok) {
        const savedProduct = responseText ? JSON.parse(responseText) : requestBody;
        
        // 🔥 Обновляем локально с маппингом backend → frontend
        let updated: Product[];
        if (editingId) {
          updated = products.map(p => 
            p.id === editingId 
              ? { 
                  ...p, 
                  name: requestBody.name,
                  description: requestBody.description,
                  category: requestBody.category,
                  unitPrice: requestBody.salePrice,
                  width: requestBody.width,
                  height: requestBody.height,
                  status: requestBody.status.toLowerCase() as "active" | "inactive" | "draft",
                  imageUrl: requestBody.imageUrl,
                  updatedAt: new Date().toISOString() 
                } 
              : p
          );
        } else {
          const newProduct: Product = {
            id: typeof savedProduct.id === 'object' ? savedProduct.id.toString() : (savedProduct.id || Date.now()),
            name: requestBody.name,
            description: requestBody.description,
            category: requestBody.category,
            unitPrice: requestBody.salePrice,
            width: requestBody.width,
            height: requestBody.height,
            status: requestBody.status.toLowerCase() as "active" | "inactive" | "draft",
            imageUrl: requestBody.imageUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          updated = [...products, newProduct];
        }
        
        setProducts(updated);
        localStorage.setItem("decor_products", JSON.stringify(updated));
        
        setShowForm(false);
        setEditingId(null);
        resetForm();
        setFormError("Yadda saxlandı");
      } else {
        throw new Error(responseText || `HTTP ${res.status}`);
      }
    } catch (error: any) {
      console.error("[Products] Error:", error);
      
      // Фолбэк
      let updated: Product[];
      if (editingId) {
        updated = products.map(p => 
          p.id === editingId 
            ? { 
                ...p, 
                name: requestBody.name, 
                unitPrice: requestBody.salePrice, 
                status: requestBody.status.toLowerCase() as "active" | "inactive" | "draft",
                updatedAt: new Date().toISOString() 
              } 
            : p
        );
      } else {
        updated = [...products, { 
          id: Date.now(), 
          name: requestBody.name, 
          unitPrice: requestBody.salePrice,
          status: requestBody.status.toLowerCase() as "active" | "inactive" | "draft",
          category: requestBody.category,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }];
      }
      
      setProducts(updated);
      localStorage.setItem("decor_products", JSON.stringify(updated));
      
      setShowForm(false);
      setEditingId(null);
      resetForm();
      setFormError("Yadda saxlandı (lokal)");
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

  const filteredProducts = products.filter(p => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
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
          <Package className="w-8 h-8 text-[#D90429]" />
          <h1 className="text-2xl font-bold text-[#1F2937]">Məhsullar</h1>
        </div>
        <Button onClick={() => { setShowForm(true); resetForm(); }} icon={<Plus className="w-4 h-4" />}>
          Yeni məhsul
        </Button>
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
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Qiymət (AZN) *</label>
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