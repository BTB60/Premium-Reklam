"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, Eye, Trash2, Award, Percent, Loader2, X } from "lucide-react";
import { authApi } from "@/lib/authApi";

type UsersTableProps = {
  /** Yalnız əsas ADMIN (JWT); subadmin üçün false. */
  canDeleteUsers?: boolean;
};

function parseUserRole(raw: unknown): string {
  return String(raw ?? "")
    .toUpperCase()
    .replace(/^ROLE_/, "");
}

export default function UsersTable({ canDeleteUsers = false }: UsersTableProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isAdminSession, setIsAdminSession] = useState(false);
  const [bonusModalUser, setBonusModalUser] = useState<any | null>(null);
  const [bonus500, setBonus500] = useState("");
  const [bonus1000, setBonus1000] = useState("");
  const [bonusSaving, setBonusSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("decor_current_user");
      if (raw) {
        const p = JSON.parse(raw) as { role?: string };
        setIsAdminSession(parseUserRole(p?.role) === "ADMIN");
      }
    } catch {
      setIsAdminSession(false);
    }
  }, []);

  const loadUsers = async () => {
    try {
      const data = await authApi.getAllUsers();
      setUsers(data || []);
    } catch (error) {
      console.error("[UsersTable] Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const openBonusModal = (u: any) => {
    setActionError(null);
    setBonusModalUser(u);
    const p500 = u.bonusLoyalty500Percent ?? u.bonus_loyalty_500_percent;
    const p1000 = u.bonusLoyalty1000Percent ?? u.bonus_loyalty_1000_percent;
    setBonus500(p500 != null && p500 !== "" ? String(p500) : "");
    setBonus1000(p1000 != null && p1000 !== "" ? String(p1000) : "");
  };

  const saveBonus = async () => {
    if (!bonusModalUser?.id) return;
    const id = bonusModalUser.id;
    const emptyToNull = (s: string) => {
      const t = s.trim();
      if (!t) return null;
      const n = parseInt(t, 10);
      if (Number.isNaN(n) || n < 0 || n > 100) throw new Error("Faiz 0–100 arası tam ədəd olmalıdır");
      return n;
    };
    setBonusSaving(true);
    setActionError(null);
    try {
      const b500 = emptyToNull(bonus500);
      const b1000 = emptyToNull(bonus1000);
      await authApi.updateUserLoyaltyBonus(id, {
        bonus500Percent: b500,
        bonus1000Percent: b1000,
      });
      setBonusModalUser(null);
      await loadUsers();
    } catch (e: any) {
      setActionError(e?.message || "Yadda saxlanılmadı");
    } finally {
      setBonusSaving(false);
    }
  };

  const resetBonusToGlobal = async () => {
    if (!bonusModalUser?.id) return;
    setBonusSaving(true);
    setActionError(null);
    try {
      await authApi.updateUserLoyaltyBonus(bonusModalUser.id, {
        bonus500Percent: null,
        bonus1000Percent: null,
      });
      setBonusModalUser(null);
      await loadUsers();
    } catch (e: any) {
      setActionError(e?.message || "Sıfırlanmadı");
    } finally {
      setBonusSaving(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone || "").includes(searchQuery)
  );

  const handleDeleteUser = async (u: any) => {
    if (!canDeleteUsers || !u?.id) return;
    const ok = window.confirm(
      `"${u.fullName || u.username}" istifadəçisini silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarılmır — əlaqəli sifarişlər və ödəniş qeydləri də silinəcək.`
    );
    if (!ok) return;
    setActionError(null);
    setDeletingId(u.id);
    try {
      await authApi.deleteUser(u.id);
      await loadUsers();
    } catch (e: any) {
      setActionError(e?.message || "İstifadəçi silinə bilmədi");
    } finally {
      setDeletingId(null);
    }
  };

  const canEditBonus = isAdminSession || canDeleteUsers;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1F2937]">İstifadəçilər</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Axtar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
            />
          </div>
          <p className="text-[#6B7280]">Ümumi: {users.length}</p>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</div>
      )}

      {loading ? (
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D90429] mx-auto" />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Ad</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">İstifadəçi adı</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Telefon</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Rol</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Bonus %</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Level</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const p500 = u.bonusLoyalty500Percent ?? u.bonus_loyalty_500_percent;
                const p1000 = u.bonusLoyalty1000Percent ?? u.bonus_loyalty_1000_percent;
                const bonusLabel =
                  p500 != null || p1000 != null ? `${p500 ?? "—"}% / ${p1000 ?? "—"}%` : "ümumi";
                return (
                  <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{u.fullName}</td>
                    <td className="py-3 px-4 text-[#6B7280]">{u.username}</td>
                    <td className="py-3 px-4 text-[#6B7280]">{u.phone || "-"}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${parseUserRole(u.role) === "ADMIN" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#6B7280]" title="500 AZN həddi / 1000 AZN həddi">
                      {bonusLabel}
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1">
                        <Award className="w-4 h-4 text-amber-500" />
                        {u.level ?? "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {canEditBonus && parseUserRole(u.role) !== "ADMIN" && (
                          <button
                            type="button"
                            onClick={() => openBonusModal(u)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title="Bonus endirim faizi (500/1000 AZN)"
                          >
                            <Percent className="w-4 h-4" />
                          </button>
                        )}
                        <button type="button" className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="Ətraflı bax">
                          <Eye className="w-4 h-4" />
                        </button>
                        {canDeleteUsers && parseUserRole(u.role) !== "ADMIN" && (
                          <button
                            type="button"
                            disabled={deletingId === u.id}
                            onClick={() => handleDeleteUser(u)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {bonusModalUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
          <Card className="w-full max-w-md p-6 relative">
            <button
              type="button"
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setBonusModalUser(null)}
              aria-label="Bağla"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-[#1F2937] pr-10 mb-1">Bonus endirim — fərdi faiz</h2>
            <p className="text-sm text-[#6B7280] mb-4">
              {bonusModalUser.fullName} (@{bonusModalUser.username}). Cari ay üzrə sifariş məbləği 500 və 1000 AZN
              hədlərində tətbiq olunacaq faizlər (ay sonunda sıfırlanır). Boş saxlasanız həmin hədd üçün ümumi sistem
              ayarı istifadə olunur.
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1">500 AZN-dən sonra endirim (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={bonus500}
                  onChange={(e) => setBonus500(e.target.value)}
                  placeholder="ümumi ayar"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1">1000 AZN-dən sonra endirim (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={bonus1000}
                  onChange={(e) => setBonus1000(e.target.value)}
                  placeholder="ümumi ayar"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button className="flex-1" onClick={() => void saveBonus()} disabled={bonusSaving}>
                {bonusSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Saxla
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => void resetBonusToGlobal()} disabled={bonusSaving}>
                Ümumi ayarlara qaytar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
