"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  Shield, Plus, Save, Trash2, Edit, FileSpreadsheet, 
  Key, CheckCircle, X, Eye, Pencil, Loader2
} from "lucide-react";
import { authApi } from "@/lib/authApi";

type PermissionLevel = "none" | "view" | "edit";

interface SubadminPermissions {
  users: PermissionLevel;
  orders: PermissionLevel;
  finance: PermissionLevel;
  products: PermissionLevel;
  inventory: PermissionLevel;
  tasks: PermissionLevel;
  support: PermissionLevel;
  analytics: PermissionLevel;
  settings: PermissionLevel;
}

interface Subadmin {
  id: string;
  login: string;
  password?: string;
  permissions: SubadminPermissions;
  createdAt: string;
  lastLogin?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:8080/api";

const FEATURES: { key: keyof SubadminPermissions; label: string }[] = [
  { key: "users", label: "İstifadəçilər" },
  { key: "orders", label: "Sifarişlər" },
  { key: "finance", label: "Maliyyə" },
  { key: "products", label: "Məhsullar" },
  { key: "inventory", label: "Anbar" },
  { key: "tasks", label: "Tapşırıqlar" },
  { key: "support", label: "Dəstək" },
  { key: "analytics", label: "Analytics" },
  { key: "settings", label: "Sistem Ayarları" },
];

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("decor_current_user");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

export default function AccessSettingsManager() {
  const [subadmins, setSubadmins] = useState<Subadmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<"az" | "en">("az");

  const [formData, setFormData] = useState<{
    login: string;
    password: string;
    permissions: SubadminPermissions;
  }>({
    login: "",
    password: "",
    permissions: {
      users: "none", orders: "none", finance: "none", products: "none",
      inventory: "none", tasks: "none", support: "none", analytics: "none", settings: "none",
    },
  });

  useEffect(() => {
    loadSubadmins();
  }, []);

  const loadSubadmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/auth/subadmins`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to load subadmins");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setSubadmins(list);
    } catch (err: any) {
      console.error("[Subadmins] Load error:", err);
      setError("Subadminlər yüklənə bilmədi");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.login || !formData.password) return;
    setSaving(true);
    setError(null);
    try {
      const token = getToken();
      const method = editingId ? "PUT" : "POST";
      const url = editingId 
        ? `${API_BASE}/auth/subadmins/${editingId}` 
        : `${API_BASE}/auth/subadmins`;

      const payload = {
        login: formData.login,
        ...(editingId ? {} : { password: formData.password }),
        permissions: formData.permissions,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save subadmin");
      
      await loadSubadmins();
      setShowForm(false);
      setEditingId(null);
      resetForm();
    } catch (err: any) {
      console.error("[Subadmins] Save error:", err);
      setError("Yadda saxlama uğursuz oldu");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, login: string) => {
    if (!confirm("Bu subadmini silmək istədiyinizə əminsiniz?")) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/auth/subadmins/${id}`, {
        method: "DELETE",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to delete");
      await loadSubadmins();
    } catch (err: any) {
      console.error("[Subadmins] Delete error:", err);
      setError("Silinə bilmədi");
    }
  };

  const handleEdit = (subadmin: Subadmin) => {
    setEditingId(subadmin.id);
    setFormData({
      login: subadmin.login,
      password: "",
      permissions: subadmin.permissions,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      login: "",
      password: "",
      permissions: {
        users: "none", orders: "none", finance: "none", products: "none",
        inventory: "none", tasks: "none", support: "none", analytics: "none", settings: "none",
      },
    });
  };

  const handleExport = () => {
    const headers = [
      "ID", "Login", "Created", "Last Login",
      ...FEATURES.map((f) => `${f.key}:view`),
      ...FEATURES.map((f) => `${f.key}:edit`),
    ];
    const rows = subadmins.map((s) => [
      s.id, s.login, s.createdAt, s.lastLogin || "",
      ...FEATURES.map((f) => (s.permissions[f.key] !== "none" ? "1" : "0")),
      ...FEATURES.map((f) => (s.permissions[f.key] === "edit" ? "1" : "0")),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subadmins_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const PermissionToggle = ({
    value,
    onChange,
  }: {
    value: PermissionLevel;
    onChange: (v: PermissionLevel) => void;
  }) => (
    <div className="flex items-center gap-4">
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={value === "view" || value === "edit"}
          onChange={(e) => onChange(e.target.checked ? "view" : "none")}
          className="rounded border-gray-300"
        />
        <span className="text-[#6B7280] flex items-center gap-1">
          <Eye className="w-3 h-3" /> Baxış
        </span>
      </label>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={value === "edit"}
          onChange={(e) => onChange(e.target.checked ? "edit" : value === "view" ? "view" : "none")}
          className="rounded border-gray-300"
        />
        <span className="text-[#6B7280] flex items-center gap-1">
          <Pencil className="w-3 h-3" /> Redaktə
        </span>
      </label>
    </div>
  );

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
          <Shield className="w-8 h-8 text-[#D90429]" />
          <h1 className="text-2xl font-bold text-[#1F2937]">Giriş Ayarları</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === "az" ? "en" : "az")}
            icon={<Key className="w-4 h-4" />}
          >
            {lang.toUpperCase()}
          </Button>
          <Button onClick={() => { setShowForm(true); resetForm(); }} icon={<Plus className="w-4 h-4" />}>
            Yeni Subadmin
          </Button>
        </div>
      </div>

      {error && (
        <Card className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">Bağla</button>
        </Card>
      )}

      {showForm && (
        <Card className="p-6 mb-6 border-2 border-[#D90429]">
          <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            {editingId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingId ? "Redaktə" : "Yeni Subadmin Yarat"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Login</label>
                <input
                  type="text"
                  value={formData.login}
                  onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">
                  {editingId ? "Yeni parol (boş saxla - dəyişməz)" : "Parol"}
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                  required={!editingId}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-2">İcazələr</label>
              <div className="grid md:grid-cols-2 gap-4">
                {FEATURES.map((f) => (
                  <div key={f.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-[#1F2937]">{f.label}</span>
                    <PermissionToggle
                      value={formData.permissions[f.key]}
                      onChange={(v) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, [f.key]: v },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" loading={saving} icon={<Save className="w-4 h-4" />}>
                Yadda saxla
              </Button>
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

      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#1F2937] flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Subadmin Siyahısı
          </h3>
          <Button variant="ghost" size="sm" onClick={handleExport} icon={<FileSpreadsheet className="w-4 h-4" />}>
            Excel-ə Export
          </Button>
        </div>

        {subadmins.length === 0 ? (
          <p className="text-[#6B7280] text-center py-8">
            Subadmin yoxdur. Yeni subadmin əlavə edin.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Login</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Yaradılıb</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Son Giriş</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">İcazələr</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {subadmins.map((s) => (
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{s.login}</td>
                    <td className="py-3 px-4 text-[#6B7280]">
                      {new Date(s.createdAt).toLocaleDateString("az-AZ")}
                    </td>
                    <td className="py-3 px-4 text-[#6B7280]">
                      {s.lastLogin ? new Date(s.lastLogin).toLocaleDateString("az-AZ") : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {FEATURES.filter((f) => s.permissions[f.key] !== "none").map((f) => (
                          <span
                            key={f.key}
                            className={`px-2 py-1 rounded text-xs ${
                              s.permissions[f.key] === "edit"
                                ? "bg-[#D90429]/10 text-[#D90429]"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {f.label} {s.permissions[f.key] === "edit" ? "✏️" : "👁️"}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(s)} className="p-2 text-blue-500 hover:bg-blue-50 rounded" title="Redaktə">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(s.id, s.login)} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Sil">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}