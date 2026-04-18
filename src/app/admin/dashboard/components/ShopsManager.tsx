"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { getAdminBearerToken, getAdminDashboardApiBase } from "./admin-dashboard-api";
import type { DashboardShop, ShopUserOption } from "./shops-manager/types";
import { ShopsHeaderBar } from "./shops-manager/ShopsHeaderBar";
import { ShopsStatsCards } from "./shops-manager/ShopsStatsCards";
import { ShopsFilterBar } from "./shops-manager/ShopsFilterBar";
import { ShopForm } from "./shops-manager/ShopForm";
import { ShopsTable } from "./shops-manager/ShopsTable";
import { ShopsFooter } from "./shops-manager/ShopsFooter";

const API_BASE = getAdminDashboardApiBase();

export default function ShopsManager() {
  const [shops, setShops] = useState<DashboardShop[]>([]);
  const [users, setUsers] = useState<ShopUserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState<Partial<DashboardShop>>({
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

  const getToken = () => getAdminBearerToken();

  const loadShops = async () => {
    try {
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
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.users || [];
        setUsers(list);
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

  const handleEdit = (shop: DashboardShop) => {
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
      const url = editingId ? `${API_BASE}/shops/${editingId}` : `${API_BASE}/shops`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
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

      const selectedUser = users.find((u) => u.id === formData.userId);
      const shopToSave: DashboardShop = {
        id: editingId || Date.now(),
        userId: formData.userId!,
        userFullName: selectedUser?.fullName || "",
        userUsername: selectedUser?.username || "",
        name: formData.name!,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        status: (formData.status as DashboardShop["status"]) || "active",
        createdAt: editingId
          ? shops.find((s) => s.id === editingId)?.createdAt || new Date().toISOString()
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let updated: DashboardShop[];
      if (editingId) {
        updated = shops.map((s) => (s.id === editingId ? shopToSave : s));
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
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        await loadShops();
      } else {
        throw new Error("API error");
      }
    } catch (error) {
      const updated = shops.filter((s) => s.id !== id);
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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        await loadShops();
      } else {
        const updated = shops.map((s) =>
          s.id === shopId
            ? { ...s, status: status as DashboardShop["status"], updatedAt: new Date().toISOString() }
            : s
        );
        setShops(updated);
        localStorage.setItem("decor_shops", JSON.stringify(updated));
      }
    } catch (error) {
      console.error("[Shops] Update error:", error);
    }
  };

  const filteredShops = shops.filter((s) => {
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
    active: shops.filter((s) => s.status === "active").length,
    inactive: shops.filter((s) => s.status === "inactive").length,
    pending: shops.filter((s) => s.status === "pending").length,
  };

  const handleExport = () => {
    const headers = ["ID", "Mağaza", "İstifadəçi", "Telefon", "Email", "Ünvan", "Status", "Tarix"];
    const rows = filteredShops.map((s) => [
      s.id,
      s.name,
      s.userFullName,
      s.phone || "-",
      s.email || "-",
      s.address || "-",
      s.status,
      new Date(s.createdAt).toLocaleDateString("az-AZ"),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
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
      <ShopsHeaderBar
        onExport={handleExport}
        onNewShop={() => {
          setEditingId(null);
          setShowForm(true);
          resetForm();
        }}
      />
      <ShopsStatsCards stats={stats} />
      <ShopsFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {showForm && (
        <ShopForm
          editingId={editingId}
          formError={formError}
          formData={formData}
          setFormData={setFormData}
          users={users}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
            resetForm();
          }}
        />
      )}

      <ShopsTable
        shops={filteredShops}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={updateShopStatus}
      />

      {filteredShops.length > 0 && (
        <ShopsFooter filteredCount={filteredShops.length} stats={{ active: stats.active, pending: stats.pending }} />
      )}
    </div>
  );
}
