"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getAdminBearerToken, getAdminDashboardApiBase } from "./admin-dashboard-api";
import { AlertCircle, Loader2, Pencil, Plus, Trash2, UserCog } from "lucide-react";

const API_BASE = getAdminDashboardApiBase();

type StaffRow = {
  id: number;
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
};

type Props = {
  lang: "az" | "en";
  canManageStaff: boolean;
};

const ROLES = [
  { value: "DIZAYNER", az: "Dizayner", en: "Designer" },
  { value: "USTA", az: "Usta", en: "Craftsperson" },
  { value: "CHAPCI", az: "Çapçı", en: "Printer" },
];

export default function WorkersManager({ lang, canManageStaff }: Props) {
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    role: "DIZAYNER",
  });

  const t = (az: string, en: string) => (lang === "az" ? az : en);

  const load = useCallback(async () => {
    setError("");
    try {
      const token = getAdminBearerToken();
      const res = await fetch(`${API_BASE}/admin/staff`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { message?: string }).message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : lang === "az" ? "Yükləmə xətası" : "Load error";
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setForm({
      fullName: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      role: "DIZAYNER",
    });
  };

  const openNew = () => {
    resetForm();
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (u: StaffRow) => {
    setEditingId(u.id);
    setForm({
      fullName: u.fullName || "",
      username: u.username || "",
      email: u.email || "",
      phone: u.phone || "",
      password: "",
      role: (u.role || "DIZAYNER").toUpperCase(),
    });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageStaff) return;
    setSaving(true);
    setError("");
    try {
      const token = getAdminBearerToken();
      const payload =
        editingId == null
          ? {
              fullName: form.fullName.trim(),
              username: form.username.trim(),
              email: form.email.trim(),
              phone: form.phone.trim() || undefined,
              password: form.password,
              role: form.role,
            }
          : {
              fullName: form.fullName.trim(),
              username: form.username.trim(),
              email: form.email.trim(),
              phone: form.phone.trim() || undefined,
              role: form.role,
              ...(form.password.length >= 6 ? { password: form.password } : {}),
            };

      const url = editingId == null ? `${API_BASE}/admin/staff` : `${API_BASE}/admin/staff/${editingId}`;
      const res = await fetch(url, {
        method: editingId == null ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { message?: string }).message || `HTTP ${res.status}`);
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("Xəta", "Error"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!canManageStaff || !confirm(t("Silmək?", "Delete?"))) return;
    setError("");
    try {
      const token = getAdminBearerToken();
      const res = await fetch(`${API_BASE}/admin/staff/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { message?: string }).message || `HTTP ${res.status}`);
      }
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("Xəta", "Error"));
    }
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#D90429]" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <UserCog className="h-7 w-7 text-[#D90429]" />
          <h2 className="text-xl font-bold text-[#1F2937]">{t("İşçilər", "Staff")}</h2>
        </div>
        {canManageStaff && (
          <Button type="button" onClick={openNew} icon={<Plus className="h-4 w-4" />}>
            {t("İşçi əlavə et", "Add staff")}
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!canManageStaff && (
        <p className="text-sm text-[#6B7280]">
          {t(
            "Yalnız baxış icazəsi: işçi əlavə və ya silmək üçün subadminə «İstifadəçilər» üçün «edit» verin.",
            "View only: grant Users «edit» on the subadmin to add or remove staff."
          )}
        </p>
      )}

      {showForm && canManageStaff && (
        <Card className="p-6 border-2 border-[#D90429]/40">
          <h3 className="font-semibold text-[#1F2937] mb-4">
            {editingId ? t("İşçini redaktə et", "Edit staff") : t("Yeni işçi", "New staff")}
          </h3>
          <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#6B7280]">{t("Ad Soyad", "Full name")} *</label>
              <input
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-[#6B7280]">{t("İstifadəçi adı", "Username")} *</label>
              <input
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-[#6B7280]">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-[#6B7280]">{t("Telefon", "Phone")}</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-[#6B7280]">
                {editingId ? t("Yeni şifrə (istəyə bağlı)", "New password (optional)") : t("Şifrə", "Password")}{" "}
                *
              </label>
              <input
                type="password"
                required={editingId == null}
                minLength={editingId == null ? 6 : undefined}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-[#6B7280]">{t("Vəzifə", "Role")} *</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {lang === "az" ? r.az : r.en}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "…" : t("Yadda saxla", "Save")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  resetForm();
                }}
              >
                {t("Ləğv et", "Cancel")}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-2 px-4">{t("Ad", "Name")}</th>
              <th className="text-left py-2 px-4">@</th>
              <th className="text-left py-2 px-4">Email</th>
              <th className="text-left py-2 px-4">{t("Rol", "Role")}</th>
              {canManageStaff && <th className="text-right py-2 px-4">{t("Əməliyyat", "Actions")}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-[#6B7280]">
                  {t("İşçi yoxdur", "No staff yet")}
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className="border-t border-gray-100">
                  <td className="py-2 px-4 font-medium">{u.fullName}</td>
                  <td className="py-2 px-4">{u.username}</td>
                  <td className="py-2 px-4">{u.email}</td>
                  <td className="py-2 px-4">
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-800">{u.role}</span>
                  </td>
                  {canManageStaff && (
                    <td className="py-2 px-4 text-right">
                      <button
                        type="button"
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        onClick={() => openEdit(u)}
                        title={t("Redaktə", "Edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        onClick={() => remove(u.id)}
                        title={t("Sil", "Delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
