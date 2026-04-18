"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { 
  Search, Download, Package, AlertTriangle, CheckCircle, 
  TrendingUp, TrendingDown, Boxes, Filter, Plus, Edit, Trash2
} from "lucide-react";

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
  stockValue: number;
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
      if (res.ok) {
        const data = await res.json();
        const products = Array.isArray(data) ? data : data?.products || [];
        
        // Мапим продукты в инвентарь
        const mapped = products.map((p: any) => {
          const stock = Number(p.stockQuantity || 0);
          const minStock = Number(p.minStockLevel || 10);
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
            unitPrice: p.salePrice !== undefined && p.salePrice !== null ? Number(p.salePrice) : 0,
            stockValue: stock * (p.salePrice !== undefined && p.salePrice !== null ? Number(p.salePrice) : 0),
            lastRestockDate: p.updatedAt,
            lastSaleDate: undefined,
            status,
            location: undefined,
            note: p.description,
          } as InventoryItem;
        });
        
        setInventory(mapped);
      }
    } catch (error) {
      console.error("[Inventory] Load error:", error);
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
        body: JSON.stringify({ stockQuantity: newStock })
      });
      if (res.ok) {
        loadInventory();
        setShowRestockForm(false);
        setSelectedItem(null);
        setRestockQuantity("");
      } else {
        alert("Stok yenilənmədi");
      }
    } catch (error) {
      console.error("[Inventory] Update error:", error);
      alert("Xəta baş verdi");
    }
  };

  const handleRestock = () => {
    if (!selectedItem || !restockQuantity) return;
    const newStock = selectedItem.currentStock + parseInt(restockQuantity);
    updateStock(selectedItem.productId, newStock);
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
    inStock: inventory.filter(i => i.status === "in_stock").length,
    lowStock: inventory.filter(i => i.status === "low_stock").length,
    outOfStock: inventory.filter(i => i.status === "out_of_stock").length,
    overstocked: inventory.filter(i => i.status === "overstocked").length,
  };

  const categories = Array.from(new Set(inventory.map(i => i.category))).filter(c => c !== "-");

  const handleExport = () => {
    const headers = ["ID", "Məhsul", "Kateqoriya", "SKU", "Stok", "Min", "Qiymət", "Dəyər", "Status"];
    const rows = filteredInventory.map(i => [
      i.id,
      i.productName,
      i.category,
      i.sku || "-",
      i.currentStock,
      i.minStockLevel,
      i.unitPrice.toFixed(2),
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
        <Button onClick={handleExport} variant="ghost" size="sm" icon={<Download className="w-4 h-4" />}>
          Export
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-[#6B7280] text-sm">Ümumi mövqe</p>
          <p className="text-2xl font-bold text-[#1F2937]">{stats.totalItems}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <p className="text-white/80 text-sm">Ümumi dəyər</p>
          <p className="text-2xl font-bold">{stats.totalValue.toFixed(2)} AZN</p>
        </Card>
        <Card className="p-4 bg-green-50">
          <p className="text-green-600 text-sm">Stokda var</p>
          <p className="text-2xl font-bold text-green-700">{stats.inStock}</p>
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

      {/* Таблица инвентаря */}
      <Card className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Məhsul</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Kateqoriya</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">SKU</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Stok</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Min</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Qiymət</th>
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
                    {item.note && (
                      <p className="text-xs text-[#6B7280] line-clamp-1">{item.note}</p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-[#6B7280]">{item.category}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-mono text-[#6B7280]">{item.sku || "-"}</span>
                  </td>
                  <td className="py-3 px-4">
                    <p className={`font-bold ${
                      item.currentStock === 0 ? "text-red-600" :
                      item.currentStock <= item.minStockLevel ? "text-amber-600" :
                      "text-green-600"
                    }`}>
                      {item.currentStock} ədəd
                    </p>
                  </td>
                  <td className="py-3 px-4 text-sm text-[#6B7280]">
                    {item.minStockLevel} ədəd
                  </td>
                  <td className="py-3 px-4 font-medium text-[#1F2937]">
                    {item.unitPrice.toFixed(2)} AZN
                  </td>
                  <td className="py-3 px-4 font-bold text-[#1F2937]">
                    {item.stockValue.toFixed(2)} AZN
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setSelectedItem(item); setShowRestockForm(true); }}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Əlavə et
                    </Button>
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
                <p className="text-white/60 text-xs">Ümumi stok dəyəri</p>
                <p className="font-bold text-green-400">{filteredInventory.reduce((s, i) => s + i.stockValue, 0).toFixed(2)} AZN</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Tükənib</p>
                <p className="font-bold text-red-400">{filteredInventory.filter(i => i.status === "out_of_stock").length} ədəd</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Az qalıb</p>
                <p className="font-bold text-amber-400">{filteredInventory.filter(i => i.status === "low_stock").length} ədəd</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}