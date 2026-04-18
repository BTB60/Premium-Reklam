"use client";

import { useEffect, useState } from "react";
import { EMPTY_PERMISSIONS, FEATURES } from "./access-settings/constants";
import { getActivityLogs, getSubadmins, logActivity, saveSubadmins } from "./access-settings/storage";
import type { ActivityLog, Subadmin, SubadminFormState } from "./access-settings/types";
import { AccessActivityLogsCard } from "./access-settings/AccessActivityLogsCard";
import { AccessSettingsHeader } from "./access-settings/AccessSettingsHeader";
import { AccessSubadminFormCard } from "./access-settings/AccessSubadminFormCard";
import { AccessSubadminsTableCard } from "./access-settings/AccessSubadminsTableCard";

export default function AccessSettingsManager() {
  const [subadmins, setSubadmins] = useState<Subadmin[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [lang, setLang] = useState<"az" | "en">("az");

  const [formData, setFormData] = useState<SubadminFormState>({
    login: "",
    password: "",
    permissions: { ...EMPTY_PERMISSIONS },
  });

  useEffect(() => {
    loadSubadmins();
    loadLogs();
  }, []);

  const loadSubadmins = () => {
    setSubadmins(getSubadmins());
  };

  const loadLogs = () => {
    setLogs(getActivityLogs());
  };

  const resetForm = () => {
    setFormData({
      login: "",
      password: "",
      permissions: { ...EMPTY_PERMISSIONS },
    });
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
    resetForm();
    loadLogs();
  };

  const handleDelete = (id: string, login: string) => {
    if (!confirm("Bu subadmini silmək istədiyinizə əminsiniz?")) return;

    const list = getSubadmins().filter((s) => s.id !== id);
    saveSubadmins(list);
    setSubadmins(list);
    logActivity(id, login, "deleted", "access_settings");
    loadLogs();
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
    loadLogs();
  };

  return (
    <div>
      <AccessSettingsHeader
        lang={lang}
        onToggleLang={() => setLang(lang === "az" ? "en" : "az")}
        onToggleForm={() => setShowForm(!showForm)}
      />

      {showForm && (
        <AccessSubadminFormCard
          editingId={editingId}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
            resetForm();
          }}
        />
      )}

      <AccessSubadminsTableCard
        subadmins={subadmins}
        exportLoading={exportLoading}
        onExport={handleExport}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AccessActivityLogsCard logs={logs} />
    </div>
  );
}
