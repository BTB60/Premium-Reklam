"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { getAdminBearerToken, getAdminDashboardApiBase } from "./admin-dashboard-api";
import type { DashboardShop, ShopUserOption } from "./shops-manager/types";
import { storeRequests, vendorStores } from "@/lib/db/vendor";
import {
  approveVendorStoreApplication,
  fetchAdminVendorStoreApplications,
  rejectVendorStoreApplication,
} from "@/lib/vendorStoreRequestApi";
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
  const [editingId, setEditingId] = useState<string | number | null>(null);
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

  const loadShopsRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    loadShops();
    loadUsers();
  }, []);

  useEffect(() => {
    // user məlumatları gələndən sonra vendor cədvəlində ad/username düzgün görünsün
    if (users.length > 0) {
      loadShops();
    }
  }, [users.length]);

  useEffect(() => {
    const onRefresh = () => {
      void loadShopsRef.current();
    };
    window.addEventListener("premium:refresh-store-requests", onRefresh);
    return () => window.removeEventListener("premium:refresh-store-requests", onRefresh);
  }, []);

  const getToken = () => getAdminBearerToken();

  const loadShops = async () => {
    try {
      const token = getToken();
      let requestRows: DashboardShop[] = [];
      let loadedStoreRequestsFromApi = false;

      if (token) {
        try {
          const apiRows = await fetchAdminVendorStoreApplications(token);
          loadedStoreRequestsFromApi = true;
          requestRows = apiRows.map((r) => ({
            id: `api-${r.id}`,
            userId: r.userId,
            userFullName: r.userFullName || r.vendorDisplayName,
            userUsername: r.username || String(r.userId),
            name: r.storeName,
            description: r.description,
            address: r.address,
            phone: r.phone,
            email: r.email || "",
            status:
              r.status === "approved"
                ? ("active" as const)
                : r.status === "rejected"
                  ? ("inactive" as const)
                  : ("pending" as const),
            createdAt: r.createdAt,
            updatedAt: r.updatedAt || r.createdAt,
          })) as DashboardShop[];
        } catch (e) {
          console.warn("[Shops] API store-requests:", e);
        }
      }

      if (!loadedStoreRequestsFromApi) {
        requestRows = storeRequests.getAll().map((r) => ({
          id: r.id,
          userId: r.vendorId,
          userFullName: r.vendorName,
          userUsername: r.vendorName,
          name: r.name,
          description: r.description,
          address: r.address,
          phone: r.phone,
          email: r.email,
          status:
            r.status === "approved"
              ? ("active" as const)
              : r.status === "rejected"
                ? ("inactive" as const)
                : ("pending" as const),
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })) as DashboardShop[];
      } else {
        const apiUserIds = new Set(requestRows.map((x) => String(x.userId)));
        const localExtra = storeRequests
          .getAll()
          .filter((r) => !apiUserIds.has(String(r.vendorId)))
          .map((r) => ({
            id: r.id,
            userId: r.vendorId,
            userFullName: r.vendorName,
            userUsername: r.vendorName,
            name: r.name,
            description: r.description,
            address: r.address,
            phone: r.phone,
            email: r.email,
            status:
              r.status === "approved"
                ? ("active" as const)
                : r.status === "rejected"
                  ? ("inactive" as const)
                  : ("pending" as const),
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          })) as DashboardShop[];
        requestRows = [...requestRows, ...localExtra];
      }

      // 2) Təsdiq edilmiş real mağazalar
      const storeRows = vendorStores.getAllIncludingInactive().map((s) => ({
        id: s.id,
        userId: s.vendorId,
        userFullName: users.find((u) => String(u.id) === String(s.vendorId))?.fullName || s.name,
        userUsername: users.find((u) => String(u.id) === String(s.vendorId))?.username || s.vendorId,
        name: s.name,
        description: s.description,
        address: s.address,
        phone: s.phone,
        email: s.email,
        status: s.isActive ? ("active" as const) : ("inactive" as const),
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })) as DashboardShop[];

      // request və store eyni vendor üçün təkrar düşməsin: store olan üstünlük alsın
      const byVendor = new Map<string, DashboardShop>();
      for (const r of requestRows) byVendor.set(String(r.userId), r);
      for (const s of storeRows) byVendor.set(String(s.userId), s);
      const combined = Array.from(byVendor.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setShops(combined);
    } catch (error) {
      console.error("[Shops] Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  loadShopsRef.current = loadShops;

  const loadUsers = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/admin/users`, {
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

  const handleDelete = async (id: string | number) => {
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
      const updated = shops.filter((s) => String(s.id) !== String(id));
      setShops(updated);
      localStorage.setItem("decor_shops", JSON.stringify(updated));
    }
  };

  const updateShopStatus = async (shopId: string | number, status: string) => {
    try {
      const sid = String(shopId);
      const token = getToken();

      if (token && sid.startsWith("api-")) {
        const numericId = Number(sid.replace(/^api-/, ""));
        if (Number.isFinite(numericId) && numericId > 0) {
          try {
            if (status === "active") {
              await approveVendorStoreApplication(token, numericId);
            } else if (status === "inactive") {
              await rejectVendorStoreApplication(
                token,
                numericId,
                "Admin tərəfindən qeyri-aktiv / rədd edildi"
              );
            }
            await loadShops();
            return;
          } catch (err) {
            console.error("[Shops] API approve/reject:", err);
            alert(err instanceof Error ? err.message : "Əməliyyat alınmadı");
            return;
          }
        }
      }

      const target = shops.find((s) => String(s.id) === String(shopId));
      if (target) {
        // Local vendor flow: pending müraciət təsdiqi/rəddi
        const request = storeRequests.getById(String(shopId));
        if (request) {
          if (status === "active") {
            storeRequests.approve(request.id, "admin");
          } else if (status === "inactive") {
            storeRequests.reject(request.id, "admin", "Admin tərəfindən qeyri-aktiv edildi");
          }
          await loadShops();
          return;
        }

        // Mövcud mağaza aktiv/passiv
        const existingStore = vendorStores.getById(String(shopId));
        if (existingStore) {
          vendorStores.update(existingStore.id, {
            isActive: status === "active",
            isApproved: status === "active" ? true : existingStore.isApproved,
          });
          await loadShops();
          return;
        }
      }

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
          String(s.id) === String(shopId)
            ? { ...s, status: status as DashboardShop["status"], updatedAt: new Date().toISOString() }
            : s
        );
        setShops(updated);
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
