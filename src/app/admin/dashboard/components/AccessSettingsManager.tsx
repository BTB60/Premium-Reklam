"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  Shield, Plus, Save, Trash2, Edit, FileSpreadsheet, 
  Key, CheckCircle, X, Eye, Pencil
} from "lucide-react";

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
  password: string;
  permissions: SubadminPermissions;
  createdAt: string;
  lastLogin?: string;
}

interface ActivityLog {
  id: string;
  subadminId: string;
  subadminLogin: string;
  action: string;
  feature: string;
  timestamp: string;
  details?: string;
}

const SUBADMINS_KEY = "premium_subadmins";
const ACTIVITY_LOGS_KEY = "premium_activity_logs";

const FEATURES = [
  { key: "users" as keyof SubadminPermissions, label: "İstifadəçilər" },
  { key: "orders" as keyof SubadminPermissions, label: "Sifarişlər" },
  { key: "finance" as keyof SubadminPermissions, label: "Maliyyə" },
  { key: "products" as keyof SubadminPermissions, label: "Məhsullar" },
  { key: "inventory" as keyof SubadminPermissions, label: "Anbar" },
  { key: "tasks" as keyof SubadminPermissions, label: "Tapşırıqlar" },
  { key: "support" as keyof SubadminPermissions, label: "Dəstək" },
  { key: "analytics" as keyof SubadminPermissions, label: "Analytics" },
  { key: "settings" as keyof SubadminPermissions, label: "Sistem Ayarları" },
];

function getSubadmins(): Subadmin[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(SUBADMINS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveSubadmins(list: Subadmin[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SUBADMINS_KEY, JSON.stringify(list));
  }
}

function getActivityLogs(): ActivityLog[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(ACTIVITY_LOGS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveActivityLogs(list: ActivityLog[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(list));
  }
}

function logActivity(subadminId: string, subadminLogin: string, action: string, feature: string, details?: string) {
  const logs = getActivityLogs();
  logs.unshift({
    id: crypto.randomUUID(),
    subadminId,
    subadminLogin,
    action,
    feature,
    timestamp: new Date().toISOString(),
    details,
  });
  saveActivityLogs(logs);
}

export default function AccessSettingsManager() {
  const [subadmins, setSubadmins] = useState<Subadmin[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [lang, setLang] = useState<"az" | "en">("az");

  const [formData, setFormData] = useState<{
    login: string;
    password: string;
    permissions: SubadminPermissions;
  }>({
    login: "",
    password: "",
    permissions: {
      users: "none",
      orders: "none",
      finance: "none",
      products: "none",
      inventory: "none",
      tasks: "none",
      support: "none",
      analytics: "none",
      settings: "none",
    },
  });

  useEffect(() => {
    loadSubadmins();
    loadLogs();
  }, []);

  const loadSubadmins = () => {
    const list = getSubadmins();
    setSubadmins(list);
  };

  const loadLogs = () => {
    const list = getActivityLogs();
    setLogs(list);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.login || !formData.password) return;

    const list = getSubadmins();

    if (editingId) {
      const idx = list.findIndex((s) => s.id === editingId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...formData };
        logActivity(editingId, formData.login, "updated", "access_settings");
      }
    } else {
      const newSub: Subadmin = {
        id: crypto.randomUUID(),
        ...formData,
        createdAt: new Date().toISOString(),
      };
      list.push(newSub);
      logActivity(newSub.id, formData.login, "created", "access_settings");
    }

    saveSubadmins(list);
    setSubadmins(list);
    setShowForm(false);
    setEditingId(null);
    setFormData({
      login: "",
      password: "",
      permissions: {
        users: "none",
        orders: "none",
        finance: "none",
        products: "none",
        inventory: "none",
        tasks: "none",
        support: "none",
        analytics: "none",
        settings: "none",
      },
    });
  };

  const handleDelete = (id: string, login: string) => {
    if (!confirm("Bu subadmini silmək istədiyinizə əminsiniz?")) return;

    const list = getSubadmins().filter((s) => s.id !== id);
    saveSubadmins(list);
    setSubadmins(list);
    logActivity(id, login, "deleted", "access_settings");
  };

  const handleEdit = (subadmin: Subadmin) => {
    setEditingId(subadmin.id);
    setFormData({
      login: subadmin.login,
      password: subadmin.password,
      permissions: subadmin.permissions,
    });
    setShowForm(true);
  };

  const handleExport = () => {
    setExportLoading(true);

    const headers = [
      "ID",
      "Login",
      "Created",
      "Last Login",
      ...FEATURES.map((f) => `${f.key}:view`),
      ...FEATURES.map((f) => `${f.key}:edit`),
    ];

    const rows = subadmins.map((s) => [
      s.id,
      s.login,
      s.createdAt,
      s.lastLogin || "",
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

    setExportLoading(false);
    logActivity("system", "admin", "exported", "access_settings", `${subadmins.length} rows`);
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
          <Button onClick={() => setShowForm(!showForm)} icon={<Plus className="w-4 h-4" />}>
            Yeni Subadmin
          </Button>
        </div>
      </div>

      {/* Форма создания/редактирования */}
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
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Parol</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-2">İcazələr</label>
              <div className="grid md:grid-cols-2 gap-4">
                {FEATURES.map((f) => (
                  <div
                    key={f.key}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
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
              <Button type="submit" icon={<Save className="w-4 h-4" />}>
                Yadda saxla
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    login: "",
                    password: "",
                    permissions: {
                      users: "none",
                      orders: "none",
                      finance: "none",
                      products: "none",
                      inventory: "none",
                      tasks: "none",
                      support: "none",
                      analytics: "none",
                      settings: "none",
                    },
                  });
                }}
                icon={<X className="w-4 h-4" />}
              >
                Ləğv et
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Список subadmin-ов */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#1F2937] flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Subadmin Siyahısı
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            loading={exportLoading}
            icon={<FileSpreadsheet className="w-4 h-4" />}
          >
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
                      {s.lastLogin
                        ? new Date(s.lastLogin).toLocaleDateString("az-AZ")
                        : "-"}
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
                        <button
                          onClick={() => handleEdit(s)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                          title="Redaktə"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.login)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                          title="Sil"
                        >
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

      {/* Логи активности */}
      <Card className="p-6">
        <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Fəaliyyət Loqları
        </h3>
        {logs.length === 0 ? (
          <p className="text-[#6B7280] text-center py-8">Loq yoxdur</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className="text-sm p-3 bg-gray-50 rounded flex items-center justify-between"
              >
                <div>
                  <span className="font-medium text-[#1F2937]">{log.subadminLogin}</span>
                  <span className="text-[#6B7280] ml-2">{log.action}</span>
                  <span className="text-[#6B7280] ml-2">[{log.feature}]</span>
                  {log.details && <span className="text-[#9CA3AF] ml-2">({log.details})</span>}
                </div>
                <span className="text-[#9CA3AF] text-xs">
                  {new Date(log.timestamp).toLocaleString("az-AZ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}