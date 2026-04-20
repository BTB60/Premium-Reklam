"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, Save, X, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { getAdminBearerToken, getAdminDashboardApiBase } from "./admin-dashboard-api";

interface Announcement {
  id: number;
  title: string;
  message: string;
  isActive: boolean;
  priority: "normal" | "important" | "urgent";
  createdAt: string;
  expiresAt?: string;
}

export default function ElanManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: "", message: "", priority: "normal", isActive: true, expiresAt: "" });

  useEffect(() => { loadAnnouncements(); }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      // 🔥 Запрос БЕЗ токена — бэкенд разрешает анонимный доступ
      const res = await fetch(`${getAdminDashboardApiBase()}/announcements`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError("Yükləmə xətası: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!formData.title.trim() || !formData.message.trim()) {
      setError("Başlıq və mətn lazımdır");
      return;
    }
    try {
      const token = getAdminBearerToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${getAdminDashboardApiBase()}/announcements`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: formData.title.trim(),
          message: formData.message.trim(),
          priority: formData.priority.toUpperCase(), // "normal" → "NORMAL" для Java enum
          isActive: formData.isActive,
          expiresAt: formData.expiresAt || null
        })
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error(
            res.status === 403
              ? "Bu əməliyyat üçün tam admin hüququ lazımdır (subadmin yalnız icazə verilmiş bölmələrə daxil ola bilər)."
              : "Sessiya etibarsızdır — yenidən daxil olun."
          );
        }
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      setSuccess("Qeyd olundu");
      await loadAnnouncements();
      setShowForm(false);
      setFormData({ title: "", message: "", priority: "normal", isActive: true, expiresAt: "" });
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError("Xəta: " + e.message);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Bu elanı silmək istədiyinizə əminsiniz?");
    if (!confirmed) return;

    setError(null);
    setSuccess(null);
    setDeletingId(id);
    try {
      const token = getAdminBearerToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${getAdminDashboardApiBase()}/announcements/${id}`, {
        method: "DELETE",
        headers
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error(
            res.status === 403
              ? "Elanı silmək üçün ADMIN hüququ lazımdır."
              : "Sessiya etibarsızdır — yenidən daxil olun."
          );
        }
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      setAnnouncements(prev => prev.filter(item => item.id !== id));
      setSuccess("Elan silindi");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError("Silmə xətası: " + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && announcements.length === 0) return <Card className="p-8 text-center">Yüklənir...</Card>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Elanlar</h1>
        <Button onClick={() => { setShowForm(true); setError(null); }} icon={<Plus className="w-4 h-4"/>}>Yeni</Button>
      </div>
      {error && <Card className="p-3 mb-3 bg-red-50 text-red-700 text-sm flex gap-2"><AlertCircle className="w-4 h-4"/> {error}</Card>}
      {success && <Card className="p-3 mb-3 bg-green-50 text-green-700 text-sm flex gap-2"><CheckCircle className="w-4 h-4"/> {success}</Card>}
      
      {showForm && (
        <Card className="p-4 mb-4 border-2 border-red-500">
          <form onSubmit={handleSubmit} className="space-y-3">
            <input className="w-full p-2 border rounded" placeholder="Başlıq" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
            <textarea className="w-full p-2 border rounded" placeholder="Mətn" rows={4} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required />
            <select className="w-full p-2 border rounded" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
              <option value="normal">Adi</option><option value="important">Vacib</option><option value="urgent">Təcili</option>
            </select>
            <input type="date" className="w-full p-2 border rounded" value={formData.expiresAt} onChange={e => setFormData({...formData, expiresAt: e.target.value})} />
            <div className="flex gap-2">
              <Button type="submit" icon={<Save className="w-4 h-4"/>}>Yadda saxla</Button>
              <Button variant="ghost" onClick={() => setShowForm(false)} icon={<X className="w-4 h-4"/>}>Ləğv</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        {announcements.length === 0 ? (
          <p className="p-4 text-gray-500">Elan yoxdur</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="p-3 text-left">Başlıq</th><th className="p-3 text-left">Prioritet</th><th className="p-3 text-left">Tarix</th><th className="p-3 text-right">Əməliyyat</th></tr></thead>
            <tbody>
              {announcements.map(a => (
                <tr key={a.id} className="border-t">
                  <td className="p-3 font-medium">{a.title}</td>
                  <td className="p-3">{a.priority}</td>
                  <td className="p-3 text-gray-500">{new Date(a.createdAt).toLocaleDateString("az-AZ")}</td>
                  <td className="p-3 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => void handleDelete(a.id)}
                      disabled={deletingId === a.id}
                      icon={<Trash2 className="w-4 h-4" />}
                    >
                      {deletingId === a.id ? "Silinir..." : "Sil"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}