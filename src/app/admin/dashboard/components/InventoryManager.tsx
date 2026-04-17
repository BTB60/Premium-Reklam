// src/app/admin/dashboard/components/InventoryManager.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { 
  Search, Download, Package, AlertTriangle, CheckCircle, 
  TrendingUp, TrendingDown, Boxes, Filter, Plus, Edit, Trash2
} from "lucide-react";
// ✅ Импорт модуля продуктов для фоллбэка
import { products } from "@/lib/db/products";

interface InventoryItem {
  id: number;
  productId: number;
  productName: string;
  category: string;
  sku?: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel?: number;
  unitPrice: number;
  costPrice?: number;
  stockValue: number;
  margin?: number;
  lastRestockDate?: string;
  lastSaleDate?: string;
  status: "in_stock" | "low_stock" | "out_of_stock" | "overstocked";
  location?: string;
  note?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "https://premium-reklam-backend.onrender.com/api";

export default function InventoryDashboard() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showRestockForm, setShowRestockForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [restockQuantity, setRestockQuantity] = useState("");
  
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [materialForm, setMaterialForm] = useState({
    name: "",
    category: "",
    unit: "m²" as const,
    quantity: "",
    minQuantity: "",
    unitPrice: "",
    costPrice: "",
    supplier: "",
  });

  useEffect(() => {
    loadInventory();
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

  const loadInventory = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/products`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      
      let productsList: any[] = [];
      
      if (res.ok) {
        const data = await res.json();
        productsList = Array.isArray(data) ? data : data?.products || [];
      } else {
        // ✅ Фоллбэк: читаем из localStorage
        console.log(`[Inventory] Backend ${res.status}, using localStorage`);
        const stored = localStorage.getItem("decor_products");
        productsList = stored ? JSON.parse(stored) : [];
      }
      
      const mapped = productsList.map((p: any) => {
        const stock = Number(p.stockQuantity || p.minOrder || 0);
        const minStock = Number(p.minStockLevel || 10);
        // ✅ Поддержка обоих полей: basePrice (Mock DB) и salePrice (Backend)
        const unitPrice = p.basePrice !== undefined ? Number(p.basePrice) : Number(p.salePrice || 0);
        const costPrice = p.costPrice !== undefined && p.costPrice !== null ? Number(p.costPrice) : 0;
        const margin = unitPrice > 0 && costPrice > 0 ? ((unitPrice - costPrice) / unitPrice * 100) : undefined;
        
        let status: InventoryItem["status"] = "in_stock";
        if (stock === 0) status = "out_of_stock";
        else if (stock <= minStock) status = "low_stock";
        else if (p.maxStockLevel && stock > p.maxStockLevel) status = "overstocked";
        
        return {
          id: p.id ? (typeof p.id === 'object' ? p.id.toString() : p.id) : Date.now(),
          productId: p.id,
          productName: p.name,
          category: p.category || "-",
          sku: p.sku,
          currentStock: stock,
          minStockLevel: minStock,
          maxStockLevel: p.maxStockLevel,
          unitPrice,
          costPrice,
          margin,
          stockValue: stock * unitPrice,
          lastRestockDate: p.updatedAt,
          lastSaleDate: undefined,
          status,
          location: undefined,
          note: p.description,
        } as InventoryItem;
      });
      
      setInventory(mapped);
    } catch (error) {
      console.error("[Inventory] Load error:", error);
      // ✅ Фоллбэк при исключении
      try {
        const stored = localStorage.getItem("decor_products");
        if (stored) {
          const productsList = JSON.parse(stored);
          const mapped = productsList.map((p: any) => ({
            id: p.id,
            productId: p.id,
            productName: p.name,
            category: p.category || "-",
            currentStock: Number(p.minOrder || 0),
            minStockLevel: 10,
            unitPrice: Number(p.basePrice || p.salePrice || 0),
            costPrice: Number(p.costPrice || 0),
            stockValue: Number(p.minOrder || 0) * Number(p.basePrice || p.salePrice || 0),
            status: "in_stock" as const,
          }));
          setInventory(mapped);
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId: number, newStock: number) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ stockQuantity: newStock, minOrder: newStock })
      });
      if (res.ok) {
        loadInventory();
        setShowRestockForm(false);
        setSelectedItem(null);
        setRestockQuantity("");
      } else {
        // ✅ Фоллбэк на Mock DB
        console.log(`[Inventory] Update API failed (${res.status}), using Mock DB`);
        const all = products.getAll();
        const index = all.findIndex(p => p.id === String(productId));
        if (index !== -1) {
          products.update(String(productId), { minOrder: newStock });
          loadInventory();
          setShowRestockForm(false);
          setSelectedItem(null);
          setRestockQuantity("");
        } else {
          alert("Stok yenilənmədi");
        }
      }
    } catch (error) {
      console.error("[Inventory] Update error:", error);
      // ✅ Фоллбэк при исключении
      try {
        const all = products.getAll();
        const index = all.findIndex(p => p.id === String(productId));
        if (index !== -1) {
          products.update(String(productId), { minOrder: newStock });
          loadInventory();
          setShowRestockForm(false);
          setSelectedItem(null);
          setRestockQuantity("");
          return;
        }
      } catch {}
      alert("Xəta baş verdi");
    }
  };

  const handleRestock = () => {
    if (!selectedItem || !restockQuantity) return;
    const newStock = selectedItem.currentStock + parseInt(restockQuantity);
    updateStock(selectedItem.productId, newStock);
  };

  const openMaterialForm = (material?: InventoryItem) => {
    if (material) {
      setEditingMaterialId(String(material.productId));
      setMaterialForm({
        name: material.productName,
        category: material.category,
        unit: "m²",
        quantity: String(material.currentStock),
        minQuantity: String(material.minStockLevel),
        unitPrice: String(material.unitPrice),
        costPrice: String(material.costPrice || ""),
        supplier: material.note || "",
      });
    } else {
      setEditingMaterialId(null);
      setMaterialForm({
        name: "", category: "", unit: "m²", quantity: "", minQuantity: "",
        unitPrice: "", costPrice: "", supplier: "",
      });
    }
    setShowMaterialForm(true);
  };

  // ✅ ИСПРАВЛЕННАЯ ФУНКЦИЯ СОХРАНЕНИЯ
  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ Подготовка правильного payload для Product интерфейса
    const payload: any = {
      name: materialForm.name,
      description: materialForm.supplier || "",  // ✅ description обязателен
      category: materialForm.category,
      basePrice: parseFloat(materialForm.unitPrice) || 0,  // ✅ basePrice, не salePrice!
      costPrice: parseFloat(materialForm.costPrice) || undefined,
      unit: materialForm.unit,
      minOrder: parseInt(materialForm.minQuantity) || 1,  // ✅ minOrder обязателен
      isActive: true,  // ✅ По умолчанию активен
      stockQuantity: parseInt(materialForm.quantity) || 0,  // Для совместимости
    };
    
    try {
      const token = getToken();
      const url = editingMaterialId 
        ? `${API_BASE}/products/${editingMaterialId}`
        : `${API_BASE}/products`;
      const method = editingMaterialId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      
      // ✅ Если API вернул ошибку — фоллбэк на Mock DB
      if (!res.ok) {
        console.warn(`[Inventory] API ${res.status}, switching to Mock DB`);
        throw new Error(`API ${res.status}`);
      }
      
      // Успех через API
      loadInventory();
      setShowMaterialForm(false);
      setEditingMaterialId(null);
      
    } catch (error: any) {
      console.log("[Inventory] API failed, using Mock DB fallback:", error?.message);
      
      try {
        // ✅ Сохранение в localStorage через products модуль
        if (editingMaterialId) {
          // Update
          const updated = products.update(editingMaterialId, payload);
          if (!updated) throw new Error("Update failed");
        } else {
          // Create
          const created = products.create(payload);
          if (!created) throw new Error("Create failed");
        }
        
        // Перезагрузка данных и закрытие формы
        loadInventory();
        setShowMaterialForm(false);
        setEditingMaterialId(null);
        
      } catch (dbError: any) {
        // ✅ Теперь ошибка видна в консоли
        console.error("[Inventory] Mock DB save error:", dbError);
        alert(`Məhsul yadda saxlanılmadı: ${dbError?.message || "Xəta"}`);
      }
    }
  };

  const handleDelete = async (productId: number) => {
    if (!confirm("Bu məhsulu silmək istədiyinizə əminsiniz?")) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/products/${productId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        loadInventory();
      } else {
        // ✅ Фоллбэк на Mock DB
        console.log(`[Inventory] Delete API failed (${res.status}), using Mock DB`);
        if (products.delete(String(productId))) {
          loadInventory();
        } else {
          alert("Silinmədi");
        }
      }
    } catch {
      // ✅ Фоллбэк при исключении
      if (products.delete(String(productId))) {
        loadInventory();
      } else {
        alert("Xəta");
      }
    }
  };

  const filteredInventory = inventory.filter(item => {
    if (searchQuery && !item.productName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
    return true;
  });

  const stats = {
    totalItems: inventory.length,
    totalValue: inventory.reduce((sum, i) => sum + i.stockValue, 0),
    totalCost: inventory.reduce((sum, i) => sum + (i.currentStock * (i.costPrice || 0)), 0),
    totalMargin: inventory.reduce((sum, i) => {
      const revenue = i.currentStock * i.unitPrice;
      const cost = i.currentStock * (i.costPrice || 0);
      return sum + (revenue - cost);
    }, 0),
    inStock: inventory.filter(i => i.status === "in_stock").length,
    lowStock: inventory.filter(i => i.status === "low_stock").length,
    outOfStock: inventory.filter(i => i.status === "out_of_stock").length,
    overstocked: inventory.filter(i => i.status === "overstocked").length,
  };

  const categories = Array.from(new Set(inventory.map(i => i.category))).filter(c => c !== "-");

  const handleExport = () => {
    const headers = ["ID", "Məhsul", "Kateqoriya", "SKU", "Stok", "Min", "Satış Qiyməti", "Maya Dəyəri", "Marja %", "Dəyər", "Status"];
    const rows = filteredInventory.map(i => [
      i.id,
      i.productName,
      i.category,
      i.sku || "-",
      i.currentStock,
      i.minStockLevel,
      i.unitPrice.toFixed(2),
      (i.costPrice || 0).toFixed(2),
      i.margin !== undefined ? i.margin.toFixed(1) + "%" : "-",
      i.stockValue.toFixed(2),
      i.status
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      in_stock: "Stokda var",
      low_stock: "Az qalıb",
      out_of_stock: "Tükənib",
      overstocked: "Çoxlu"
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      in_stock: "bg-green-100 text-green-700",
      low_stock: "bg-amber-100 text-amber-700",
      out_of_stock: "bg-red-100 text-red-700",
      overstocked: "bg-blue-100 text-blue-700"
    };
    return colors[status] || "bg-gray-100 text-gray-700";
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
          <Boxes className="w-8 h-8 text-[#D90429]" />
          <h1 className="text-2xl font-bold text-[#1F2937]">Anbar</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openMaterialForm()} variant="ghost" size="sm" icon={<Plus className="w-4 h-4" />}>
            Yeni Material
          </Button>
          <Button onClick={handleExport} variant="ghost" size="sm" icon={<Download className="w-4 h-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-[#6B7280] text-sm">Ümumi mövqe</p>
          <p className="text-2xl font-bold text-[#1F2937]">{stats.totalItems}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <p className="text-white/80 text-sm">Stok dəyəri</p>
          <p className="text-2xl font-bold">{stats.totalValue.toFixed(2)} AZN</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <p className="text-white/80 text-sm">Maya dəyəri</p>
          <p className="text-2xl font-bold">{stats.totalCost.toFixed(2)} AZN</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <p className="text-white/80 text-sm">Gözlənilən mənfəət</p>
          <p className="text-2xl font-bold">{stats.totalMargin.toFixed(2)} AZN</p>
        </Card>
        <Card className="p-4 bg-amber-50">
          <p className="text-amber-600 text-sm flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" /> Az qalıb
          </p>
          <p className="text-2xl font-bold text-amber-700">{stats.lowStock}</p>
        </Card>
        <Card className="p-4 bg-red-50">
          <p className="text-red-600 text-sm">Tükənib</p>
          <p className="text-2xl font-bold text-red-700">{stats.outOfStock}</p>
        </Card>
      </div>

      {/* Фильтры */}
      <Card className="p-4 mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Axtar: məhsul adı, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          >
            <option value="all">Bütün statuslar</option>
            <option value="in_stock">Stokda var</option>
            <option value="low_stock">Az qalıb</option>
            <option value="out_of_stock">Tükənib</option>
            <option value="overstocked">Çoxlu</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          >
            <option value="all">Bütün kateqoriyalar</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Форма создания/редактирования */}
      {showMaterialForm && (
        <Card className="p-6 mb-6 border-2 border-[#D90429]">
          <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            {editingMaterialId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingMaterialId ? "Materialı redaktə et" : "Yeni material əlavə et"}
          </h3>
          <form onSubmit={handleMaterialSubmit} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Ad *</label>
              <input
                type="text"
                value={materialForm.name}
                onChange={(e) => setMaterialForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Kateqoriya</label>
              <input
                type="text"
                value={materialForm.category}
                onChange={(e) => setMaterialForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Stok</label>
              <input
                type="number"
                min="0"
                value={materialForm.quantity}
                onChange={(e) => setMaterialForm(f => ({ ...f, quantity: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Min. Stok</label>
              <input
                type="number"
                min="0"
                value={materialForm.minQuantity}
                onChange={(e) => setMaterialForm(f => ({ ...f, minQuantity: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Satış Qiyməti (AZN)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={materialForm.unitPrice}
                onChange={(e) => setMaterialForm(f => ({ ...f, unitPrice: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Maya Dəyəri (AZN)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={materialForm.costPrice}
                onChange={(e) => setMaterialForm(f => ({ ...f, costPrice: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Təchizatçı / Qeyd</label>
              <input
                type="text"
                value={materialForm.supplier}
                onChange={(e) => setMaterialForm(f => ({ ...f, supplier: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" icon={<CheckCircle className="w-4 h-4" />}>Yadda saxla</Button>
              <Button type="button" variant="ghost" onClick={() => setShowMaterialForm(false)}>Ləğv et</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Форма пополнения */}
      {showRestockForm && selectedItem && (
        <Card className="p-6 mb-6 border-2 border-[#D90429]">
          <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Stoku artır: {selectedItem.productName}
          </h3>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Miqdar</label>
              <input
                type="number"
                min="1"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                placeholder="Neçə ədəd əlavə?"
              />
            </div>
            <div className="text-sm text-[#6B7280] mb-2">
              Hazırda: <span className="font-bold">{selectedItem.currentStock}</span> ədəd
              <br />
              Yeni: <span className="font-bold text-[#D90429]">{selectedItem.currentStock + (parseInt(restockQuantity) || 0)}</span> ədəd
            </div>
            <Button onClick={handleRestock} icon={<CheckCircle className="w-4 h-4" />}>
              Təsdiq et
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setShowRestockForm(false); setSelectedItem(null); setRestockQuantity(""); }}
              icon={<Edit className="w-4 h-4" />}
            >
              Ləğv et
            </Button>
          </div>
        </Card>
      )}

      {/* Таблица */}
      <Card className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Məhsul</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Kateqoriya</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Stok</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Satış</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Maya</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Marja</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Dəyər</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-[#6B7280]">
                  Anbar məlumatı tapılmadı
                </td>
              </tr>
            ) : (
              filteredInventory.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-[#1F2937]">{item.productName}</p>
                    {item.note && <p className="text-xs text-[#6B7280] line-clamp-1">{item.note}</p>}
                  </td>
                  <td className="py-3 px-4 text-sm text-[#6B7280]">{item.category}</td>
                  <td className="py-3 px-4">
                    <p className={`font-bold ${
                      item.currentStock === 0 ? "text-red-600" :
                      item.currentStock <= item.minStockLevel ? "text-amber-600" : "text-green-600"
                    }`}>{item.currentStock}</p>
                  </td>
                  <td className="py-3 px-4 font-medium text-[#1F2937]">{item.unitPrice.toFixed(2)} AZN</td>
                  <td className="py-3 px-4 text-[#6B7280]">{(item.costPrice || 0).toFixed(2)} AZN</td>
                  <td className="py-3 px-4">
                    {item.margin !== undefined ? (
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.margin >= 30 ? "bg-green-100 text-green-700" :
                        item.margin >= 15 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                      }`}>{item.margin.toFixed(1)}%</span>
                    ) : "-"}
                  </td>
                  <td className="py-3 px-4 font-bold text-[#1F2937]">{item.stockValue.toFixed(2)} AZN</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openMaterialForm(item)} className="text-blue-600">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(item.productId)} className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Итоговая строка */}
      {filteredInventory.length > 0 && (
        <Card className="mt-4 p-4 bg-[#1F2937] text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-white/60 text-xs">Göstərilən</p>
                <p className="font-bold">{filteredInventory.length} mövqe</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Stok dəyəri</p>
                <p className="font-bold text-blue-400">{filteredInventory.reduce((s, i) => s + i.stockValue, 0).toFixed(2)} AZN</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Maya dəyəri</p>
                <p className="font-bold text-purple-400">{filteredInventory.reduce((s, i) => s + (i.currentStock * (i.costPrice || 0)), 0).toFixed(2)} AZN</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Gözlənilən mənfəət</p>
                <p className="font-bold text-green-400">
                  {filteredInventory.reduce((s, i) => s + (i.currentStock * (i.unitPrice - (i.costPrice || 0))), 0).toFixed(2)} AZN
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}