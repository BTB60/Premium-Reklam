"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/authApi";
import { getAdminBearerToken, getAdminDashboardApiBase } from "./admin-dashboard-api";
import { Loader2, RefreshCw, Save, Trash2, Tag } from "lucide-react";

const API_BASE = getAdminDashboardApiBase();

type RowUser = {
  id: number;
  username?: string;
  fullName?: string;
  role?: string;
};

type RowProduct = {
  id: number;
  name: string;
  salePrice?: number;
  category?: string;
};

type UserPriceRow = {
  id?: number;
  customPrice?: number;
  discountPercent?: number;
  user?: { id: number; username?: string; fullName?: string };
  product?: { id: number; name?: string; salePrice?: number };
};

function numId(raw: unknown): number | null {
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export default function UserPricesManager() {
  const [users, setUsers] = useState<RowUser[]>([]);
  const [products, setProducts] = useState<RowProduct[]>([]);
  const [userPrices, setUserPrices] = useState<UserPriceRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [customPrice, setCustomPrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [loading, setLoading] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const token = () => getAdminBearerToken();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("decor_current_user");
      if (raw) {
        const p = JSON.parse(raw) as { role?: string };
        const r = String(p?.role || "").toUpperCase().replace(/^ROLE_/, "");
        setIsAdmin(r === "ADMIN");
      }
    } catch {
      setIsAdmin(false);
    }
  }, []);

  const loadUsersAndProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [uList, pRes] = await Promise.all([
        authApi.getAllUsers(),
        fetch(`${API_BASE}/products`, {
          headers: token() ? { Authorization: `Bearer ${token()}` } : {},
        }),
      ]);
      const u = Array.isArray(uList) ? uList : [];
      setUsers(
        u
          .map((x: any) => ({
            id: numId(x.id) ?? 0,
            username: x.username,
            fullName: x.fullName,
            role: x.role,
          }))
          .filter((x) => x.id > 0)
      );

      if (pRes.ok) {
        const data = await pRes.json();
        const list = Array.isArray(data) ? data : [];
        setProducts(
          list.map((p: any) => ({
            id: numId(p.id) ?? 0,
            name: String(p.name || ""),
            salePrice: p.salePrice != null ? Number(p.salePrice) : undefined,
            category: p.category,
          })).filter((p: RowProduct) => p.id > 0)
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklənmə xətası");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserPrices = useCallback(async (userId: number) => {
    setLoadingPrices(true);
    setError(null);
    try {
      const t = token();
      const res = await fetch(`${API_BASE}/products/user-prices/${userId}`, {
        headers: t ? { Authorization: `Bearer ${t}` } : {},
      });
      if (res.status === 403) {
        setError("Bu əməliyyat üçün əsas admin (ADMIN) girişi tələb olunur.");
        setUserPrices([]);
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        setError(text || `Sorğu uğursuz (${res.status})`);
        setUserPrices([]);
        return;
      }
      const data = await res.json();
      setUserPrices(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xəta");
      setUserPrices([]);
    } finally {
      setLoadingPrices(false);
    }
  }, []);

  useEffect(() => {
    void loadUsersAndProducts();
  }, [loadUsersAndProducts]);

  useEffect(() => {
    const id = Number(selectedUserId);
    if (!Number.isFinite(id) || id <= 0) {
      setUserPrices([]);
      return;
    }
    void loadUserPrices(id);
  }, [selectedUserId, loadUserPrices]);

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === selectedProductId),
    [products, selectedProductId]
  );

  const handleSave = async () => {
    const userId = Number(selectedUserId);
    const productId = Number(selectedProductId);
    const price = parseFloat(customPrice.replace(",", "."));
    const disc = parseFloat(discountPercent.replace(",", ".") || "0");

    if (!Number.isFinite(userId) || userId <= 0) {
      alert("İstifadəçi seçin");
      return;
    }
    if (!Number.isFinite(productId) || productId <= 0) {
      alert("Məhsul seçin");
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      alert("Düzgün xüsusi qiymət daxil edin");
      return;
    }
    if (Number.isNaN(disc) || disc < 0 || disc > 100) {
      alert("Endirim faizi 0–100 arası olmalıdır");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const t = token();
      const res = await fetch(`${API_BASE}/products/user-prices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
        body: JSON.stringify({
          userId,
          productId,
          customPrice: price,
          discountPercent: disc,
        }),
      });
      if (res.status === 403) {
        setError("Yalnız əsas admin qiymət təyin edə bilər.");
        return;
      }
      if (!res.ok) {
        let msg = `Xəta (${res.status})`;
        try {
          const j = await res.json();
          if (j?.message) msg = j.message;
        } catch {
          /* ignore */
        }
        setError(msg);
        return;
      }
      setCustomPrice("");
      setDiscountPercent("0");
      await loadUserPrices(userId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yadda saxlanılmadı");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: number, productId: number) => {
    if (!confirm("Bu xüsusi qiyməti silmək istəyirsiniz? (Standart məhsul qiyməti tətbiq olunacaq)")) return;
    const t = token();
    try {
      const res = await fetch(`${API_BASE}/products/user-prices/${userId}/product/${productId}`, {
        method: "DELETE",
        headers: t ? { Authorization: `Bearer ${t}` } : {},
      });
      if (!res.ok && res.status !== 204) {
        setError("Silinmədi");
        return;
      }
      await loadUserPrices(userId);
    } catch {
      setError("Şəbəkə xətası");
    }
  };

  const customerUsers = useMemo(
    () => users.filter((u) => String(u.role || "").toUpperCase() !== "ADMIN"),
    [users]
  );

  if (loading) {
    return (
      <Card className="p-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D90429]" />
      </Card>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937] flex items-center gap-2">
            <Tag className="w-7 h-7 text-[#ff6600]" />
            Müştəri üzrə qiymət
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Seçilmiş müştəri üçün məhsulun vahid qiymətini təyin edin (sifarişdə bu qiymət istifadə olunur).
            Endirim % &gt; 0 olduqda isə kataloq qiymətinə endirim tətbiq olunur — sabit qiymət üçün 0 yazın.
          </p>
        </div>
        <Button variant="ghost" onClick={() => void loadUsersAndProducts()} icon={<RefreshCw className="w-4 h-4" />}>
          Yenilə
        </Button>
      </div>

      {!isAdmin && (
        <Card className="p-4 mb-4 border-amber-200 bg-amber-50 text-amber-900 text-sm">
          Subadmin hesabı ilə yalnız siyahıya baxa bilərsiniz; qiymət yazmaq və silmək üçün əsas admin girişi lazımdır.
        </Card>
      )}

      {error && (
        <Card className="p-3 mb-4 border-red-200 bg-red-50 text-red-800 text-sm">{error}</Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold text-[#1F2937] mb-4">Yeni / yenilə</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Müştəri</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
              >
                <option value="">Seçin...</option>
                {customerUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName || u.username} (@{u.username}) — ID {u.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Məhsul</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
              >
                <option value="">Seçin...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.salePrice != null ? ` — kataloq ${p.salePrice} AZN` : ""}
                  </option>
                ))}
              </select>
            </div>
            {selectedProduct && (
              <p className="text-xs text-[#6B7280]">
                Kataloq qiyməti: <span className="font-medium">{selectedProduct.salePrice ?? "—"} AZN</span>
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Xüsusi qiymət (AZN)</label>
              <input
                type="text"
                inputMode="decimal"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="məs: 4.50"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Endirim % (0 = yalnız xüsusi qiymət)</label>
              <input
                type="text"
                inputMode="decimal"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <Button
              onClick={() => void handleSave()}
              disabled={saving || !isAdmin}
              icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            >
              Saxla
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-[#1F2937] mb-2">Seçilmiş müştərinin xüsusi qiymətləri</h2>
          {!selectedUserId ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">Əvvəlcə müştəri seçin.</p>
          ) : loadingPrices ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#D90429]" />
            </div>
          ) : userPrices.length === 0 ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">Bu müştəri üçün xüsusi qiymət yoxdur.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-[#6B7280]">
                    <th className="py-2 pr-2">Məhsul</th>
                    <th className="py-2 pr-2">Xüsusi AZN</th>
                    <th className="py-2 pr-2">Endirim %</th>
                    <th className="py-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {userPrices.map((row) => {
                    const pid = row.product?.id ?? numId((row as any).productId);
                    const uid = row.user?.id ?? Number(selectedUserId);
                    const pname = row.product?.name ?? "—";
                    return (
                      <tr key={`${row.id}-${pid}`} className="border-b border-gray-100">
                        <td className="py-2 pr-2 font-medium">{pname}</td>
                        <td className="py-2 pr-2">{row.customPrice != null ? Number(row.customPrice).toFixed(2) : "—"}</td>
                        <td className="py-2 pr-2">{row.discountPercent != null ? String(row.discountPercent) : "0"}</td>
                        <td className="py-2">
                          {isAdmin && pid != null && (
                            <button
                              type="button"
                              onClick={() => void handleDelete(uid, pid)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
