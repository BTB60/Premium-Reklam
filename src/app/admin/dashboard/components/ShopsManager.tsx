"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { 
  Search, Download, Plus, Edit, Trash2, Save, X, Store, AlertCircle,
  MapPin, Phone, Mail, Calendar, CheckCircle, Users
} from "lucide-react";

interface Shop {
  id: number;
  userId: string;
  userFullName: string;
  userUsername: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  status: "active" | "inactive" | "pending";
  createdAt: string;
  updatedAt?: string;
}

interface User {
  id: string;
  fullName: string;
  username: string;
  email?: string;
  phone?: string;
  role?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "https://premium-reklam-backend.onrender.com/api";

export default function ShopsManager() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState<Partial<Shop>>({
    userId: "",
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    status: "active",
  });

  useEffect(() => {
    loadShops();
    loadUsers();
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

  const loadShops = async () => {
    try {
      const token = getToken();
      const stored = localStorage.getItem("decor_shops");
      if (stored) {
        setShops(JSON.parse(stored));
      }
    } catch (error) {
      console.error("[Shops] Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/users`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.users || [];
        const customers = list.filter((u: User) => (u as any).role !== "ADMIN");
        setUsers(customers);
      }
    } catch (error) {
      console.error("[Shops] Load users error:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      userId: "",
      name: "",
      description: "",
      address: "",
      phone: "",
      email: "",
      status: "active",
    });
    setFormError("");
  };

  const handleEdit = (shop: Shop) => {
    setEditingId(shop.id);
    setFormData({
      userId: shop.userId,
      name: shop.name,
      description: shop.description,
      address: shop.address,
      phone: shop.phone,
      email: shop.email,
      status: shop.status,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name?.trim()) {
      setFormError("Ad tələb olunur");
      return;
    }
    if (!formData.userId) {
      setFormError("İstifadəçi seçilməyib");
      return;
    }

    try {
      const token = getToken();
      const method = editingId ? "PUT" : "POST";
      const url = editingId 
        ? `${API_BASE}/shops/${editingId}` 
        : `${API_BASE}/shops`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await loadShops();
        setShowForm(false);
        setEditingId(null);
        resetForm();
      } else {
        throw new Error("API error");
      }
    } catch (error) {
      console.error("[Shops] Save error:", error);
      
      const selectedUser = users.find(u => u.id === formData.userId);
      const shopToSave: Shop = {
        id: editingId || Date.now(),
        userId: formData.userId!,
        userFullName: selectedUser?.fullName || "",
        userUsername: selectedUser?.username || "",
        name: formData.name!,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        status: formData.status as any || "active",
        createdAt: editingId 
          ? shops.find(s => s.id === editingId)?.createdAt || new Date().toISOString()
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let updated: Shop[];
      if (editingId) {
        updated = shops.map(s => s.id === editingId ? shopToSave : s);
      } else {
        updated = [...shops, shopToSave];
      }
      
      setShops(updated);
      localStorage.setItem("decor_shops", JSON.stringify(updated));
      
      setShowForm(false);
      setEditingId(null);
      resetForm();
      setFormError("Yadda saxlandı (lokal)");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Mağazanı silmək istədiyinizə əminsiniz?")) return;
    
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/shops/${id}`, {
        method: "DELETE",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      
      if (res.ok) {
        await loadShops();
      } else {
        throw new Error("API error");
      }
    } catch (error) {
      const updated = shops.filter(s => s.id !== id);
      setShops(updated);
      localStorage.setItem("decor_shops", JSON.stringify(updated));
    }
  };

  const updateShopStatus = async (shopId: number, status: string) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/shops/${shopId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        await loadShops();
      } else {
        const updated = shops.map(s => 
          s.id === shopId ? { ...s, status: status as any, updatedAt: new Date().toISOString() } : s
        );
        setShops(updated);
        localStorage.setItem("decor_shops", JSON.stringify(updated));
      }
    } catch (error) {
      console.error("[Shops] Update error:", error);
    }
  };

  const filteredShops = shops.filter(s => {
    if (searchQuery) {
      const matchesSearch = 
        s.id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.userFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.userUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.address?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
    }
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: shops.length,
    active: shops.filter(s => s.status === "active").length,
    inactive: shops.filter(s => s.status === "inactive").length,
    pending: shops.filter(s => s.status === "pending").length,
  };

  const handleExport = () => {
    const headers = ["ID", "Mağaza", "İstifadəçi", "Telefon", "Email", "Ünvan", "Status", "Tarix"];
    const rows = filteredShops.map(s => [
      s.id,
      s.name,
      s.userFullName,
      s.phone || "-",
      s.email || "-",
      s.address || "-",
      s.status,
      new Date(s.createdAt).toLocaleDateString("az-AZ")
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shops_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
          <Store className="w-8 h-8 text-[#D90429]" />
          <h1 className="text-2xl font-bold text-[#1F2937]">Mağazalar</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="ghost" size="sm" icon={<Download className="w-4 h-4" />}>
            Export
          </Button>
          <Button onClick={() => { setShowForm(true); resetForm(); }} icon={<Plus className="w-4 h-4" />}>
            Yeni mağaza
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-[#6B7280] text-sm">Ümumi</p>
          <p className="text-2xl font-bold text-[#1F2937]">{stats.total}</p>
        </Card>
        <Card className="p-4 bg-green-50">
          <p className="text-green-600 text-sm flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> Aktiv
          </p>
          <p className="text-2xl font-bold text-green-700">{stats.active}</p>
        </Card>
        <Card className="p-4 bg-amber-50">
          <p className="text-amber-600 text-sm">Gözləyir</p>
          <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
        </Card>
        <Card className="p-4 bg-gray-50">
          <p className="text-gray-600 text-sm">Qeyri-aktiv</p>
          <p className="text-2xl font-bold text-gray-700">{stats.inactive}</p>
        </Card>
      </div>

      <Card className="p-4 mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Axtar: mağaza adı, istifadəçi, ünvan..."
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
            <option value="active">Aktiv</option>
            <option value="pending">Gözləyir</option>
            <option value="inactive">Qeyri-aktiv</option>
          </select>
        </div>
      </Card>

      {showForm && (
        <Card className="p-6 mb-6 border-2 border-[#D90429]">
          <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            {editingId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingId ? "Mağazanı redaktə et" : "Yeni mağaza əlavə et"}
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
                <label className="block text-sm font-medium text-[#6B7280] mb-1">İstifadəçi *</label>
                <select
                  value={formData.userId || ""}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                  required
                  disabled={!!editingId}
                >
                  <option value="">Seçin</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName} (@{u.username})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Mağaza adı *</label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                  placeholder="+994 XX XXX XX XX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Ünvan</label>
                <input
                  type="text"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                  placeholder="Şəhər, küçə, ev"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Təsvir</label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
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
                  <option value="pending">Gözləyir</option>
                  <option value="inactive">Qeyri-aktiv</option>
                </select>
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
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Mağaza</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">İstifadəçi</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Əlaqə</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Ünvan</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Tarix</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {filteredShops.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#6B7280]">
                  Mağaza tapılmadı
                </td>
              </tr>
            ) : (
              filteredShops.map((shop) => (
                <tr key={shop.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#D90429]/10 rounded-full flex items-center justify-center">
                        <Store className="w-5 h-5 text-[#D90429]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#1F2937]">{shop.name}</p>
                        {shop.description && (
                          <p className="text-xs text-[#6B7280] line-clamp-1">{shop.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-sm">{shop.userFullName}</p>
                      <p className="text-xs text-[#6B7280]">@{shop.userUsername}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      {shop.phone && (
                        <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                          <Phone className="w-3 h-3" />
                          {shop.phone}
                        </div>
                      )}
                      {shop.email && (
                        <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                          <Mail className="w-3 h-3" />
                          {shop.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {shop.address ? (
                      <div className="flex items-center gap-1 text-sm text-[#6B7280]">
                        <MapPin className="w-4 h-4" />
                        {shop.address}
                      </div>
                    ) : (
                      <span className="text-sm text-[#6B7280]">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={shop.status}
                      onChange={(e) => updateShopStatus(shop.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded border ${
                        shop.status === "active" ? "bg-green-100 text-green-700 border-green-200" :
                        shop.status === "pending" ? "bg-amber-100 text-amber-700 border-amber-200" :
                        "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      <option value="active">Aktiv</option>
                      <option value="pending">Gözləyir</option>
                      <option value="inactive">Qeyri-aktiv</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-sm text-[#6B7280]">
                      <Calendar className="w-4 h-4" />
                      {new Date(shop.createdAt).toLocaleDateString("az-AZ")}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(shop)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                        title="Redaktə"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(shop.id)}
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

      {filteredShops.length > 0 && (
        <Card className="mt-4 p-4 bg-[#1F2937] text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-white/60 text-xs">Göstərilən</p>
                <p className="font-bold">{filteredShops.length} ədəd</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Aktiv</p>
                <p className="font-bold text-green-400">{stats.active} ədəd</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Gözləyir</p>
                <p className="font-bold text-amber-400">{stats.pending} ədəd</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}