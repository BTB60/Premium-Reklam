"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, Eye, Trash2, Award } from "lucide-react";
import { authApi } from "@/lib/authApi";

type UsersTableProps = {
  /** Yalnız əsas ADMIN (JWT); subadmin üçün false. */
  canDeleteUsers?: boolean;
};

export default function UsersTable({ canDeleteUsers = false }: UsersTableProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
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
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Level</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{u.fullName}</td>
                  <td className="py-3 px-4 text-[#6B7280]">{u.username}</td>
                  <td className="py-3 px-4 text-[#6B7280]">{u.phone || "-"}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === "ADMIN" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-amber-500" />
                      {u.level}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="Ətraflı bax">
                        <Eye className="w-4 h-4" />
                      </button>
                      {canDeleteUsers && u.role !== "ADMIN" && (
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
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}