"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  Megaphone, Plus, Edit, Trash2, Save, X, Send, Eye, EyeOff,
  AlertCircle, CheckCircle, Calendar, Clock
} from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  message: string;
  isActive: boolean;
  priority: "normal" | "important" | "urgent";
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
  createdBy: string;
}

interface AnnouncementRead {
  announcementId: number;
  userId: string;
  readAt: string;
}

export default function ElanManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState<Partial<Announcement>>({
    title: "",
    message: "",
    isActive: true,
    priority: "normal",
    expiresAt: "",
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = () => {
    try {
      const stored = localStorage.getItem("decor_announcements");
      if (stored) {
        setAnnouncements(JSON.parse(stored));
      }
    } catch (error) {
      console.error("[Elan] Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      isActive: true,
      priority: "normal",
      expiresAt: "",
    });
  };

  const handleNew = () => {
    setEditingId(null);
    resetForm();
    setShowForm(true);
    setShowPreview(false);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      isActive: announcement.isActive,
      priority: announcement.priority,
      expiresAt: announcement.expiresAt?.split("T")[0] || "",
    });
    setShowForm(true);
    setShowPreview(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim() || !formData.message?.trim()) {
      alert("Başlıq və mətn tələb olunur");
      return;
    }

    const announcement: Announcement = {
      id: editingId || Date.now(),
      title: formData.title!.trim(),
      message: formData.message!.trim(),
      isActive: formData.isActive ?? true,
      priority: formData.priority as any || "normal",
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
      createdAt: editingId 
        ? announcements.find(a => a.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "Admin",
    };

    let updated: Announcement[];
    if (editingId) {
      updated = announcements.map(a => a.id === editingId ? announcement : a);
    } else {
      updated = [...announcements, announcement];
    }

    setAnnouncements(updated);
    localStorage.setItem("decor_announcements", JSON.stringify(updated));
    
    // 🔥 ЛОГ СОХРАНЕНИЯ ДЛЯ ОТЛАДКИ
    console.log("✅ [ElanManager] Saved to localStorage:", {
      key: "decor_announcements",
      count: updated.length,
      latest: updated[updated.length - 1]?.title,
      timestamp: new Date().toISOString()
    });
    
    // При создании нового объявления сбрасываем прочтения у всех пользователей
    if (!editingId) {
      localStorage.removeItem("decor_announcement_reads");
      console.log("✅ [ElanManager] Cleared announcement reads for new announcement");
    }

    setShowForm(false);
    setEditingId(null);
    resetForm();
    alert("Elan yadda saxlandı");
  };

  const handleDelete = (id: number) => {
    if (!confirm("Elanı silmək istədiyinizə əminsiniz?")) return;
    
    const updated = announcements.filter(a => a.id !== id);
    setAnnouncements(updated);
    localStorage.setItem("decor_announcements", JSON.stringify(updated));
    
    console.log("✅ [ElanManager] Deleted announcement, updated localStorage");
    
    alert("Elan silindi");
  };

  const toggleActive = (id: number) => {
    const updated = announcements.map(a => 
      a.id === id ? { ...a, isActive: !a.isActive, updatedAt: new Date().toISOString() } : a
    );
    setAnnouncements(updated);
    localStorage.setItem("decor_announcements", JSON.stringify(updated));
    
    console.log("✅ [ElanManager] Toggled active status, updated localStorage");
  };

  const handlePreview = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowPreview(true);
    setShowForm(false);
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      normal: "bg-blue-100 text-blue-700",
      important: "bg-amber-100 text-amber-700",
      urgent: "bg-red-100 text-red-700"
    };
    return colors[priority] || "bg-gray-100 text-gray-700";
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      normal: "Adi",
      important: "Vacib",
      urgent: "Təcili"
    };
    return labels[priority] || priority;
  };

  const activeCount = announcements.filter(a => a.isActive).length;
  const totalReads = announcements.reduce((sum, a) => {
    const reads = JSON.parse(localStorage.getItem("decor_announcement_reads") || "[]");
    return sum + reads.filter((r: AnnouncementRead) => r.announcementId === a.id).length;
  }, 0);

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
          <Megaphone className="w-8 h-8 text-[#D90429]" />
          <h1 className="text-2xl font-bold text-[#1F2937]">Elanlar</h1>
        </div>
        <Button onClick={handleNew} icon={<Plus className="w-4 h-4" />}>
          Yeni elan
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-[#6B7280] text-sm">Ümumi</p>
          <p className="text-2xl font-bold text-[#1F2937]">{announcements.length}</p>
        </Card>
        <Card className="p-4 bg-green-50">
          <p className="text-green-600 text-sm flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> Aktiv
          </p>
          <p className="text-2xl font-bold text-green-700">{activeCount}</p>
        </Card>
        <Card className="p-4 bg-blue-50">
          <p className="text-blue-600 text-sm">Oxunma sayı</p>
          <p className="text-2xl font-bold text-blue-700">{totalReads}</p>
        </Card>
        <Card className="p-4 bg-amber-50">
          <p className="text-amber-600 text-sm">Qeyri-aktiv</p>
          <p className="text-2xl font-bold text-amber-700">{announcements.length - activeCount}</p>
        </Card>
      </div>

      {/* Форма создания/редактирования */}
      {showForm && (
        <Card className="p-6 mb-6 border-2 border-[#D90429]">
          <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            {editingId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingId ? "Elanı redaktə et" : "Yeni elan əlavə et"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Başlıq *</label>
              <input
                type="text"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                placeholder="Məsələn: Endirim xəbəri!"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Mətn *</label>
              <textarea
                value={formData.message || ""}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                placeholder="Elan mətninizi daxil edin..."
                required
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Prioritet</label>
                <select
                  value={formData.priority || "normal"}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                >
                  <option value="normal">Adi</option>
                  <option value="important">Vacib</option>
                  <option value="urgent">Təcili</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Aktiv</label>
                <select
                  value={formData.isActive ? "true" : "false"}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "true" })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                >
                  <option value="true">Bəli</option>
                  <option value="false">Xeyr</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Bitmə tarixi</label>
                <input
                  type="date"
                  value={formData.expiresAt || ""}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" icon={<Save className="w-4 h-4" />}>Yadda saxla</Button>
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

      {/* Предпросмотр объявления */}
      {showPreview && selectedAnnouncement && (
        <Card className="p-6 mb-6 border-2 border-[#D90429] bg-gradient-to-br from-[#D90429]/5 to-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                selectedAnnouncement.priority === "urgent" ? "bg-red-100" :
                selectedAnnouncement.priority === "important" ? "bg-amber-100" :
                "bg-blue-100"
              }`}>
                <Megaphone className={`w-6 h-6 ${
                  selectedAnnouncement.priority === "urgent" ? "text-red-600" :
                  selectedAnnouncement.priority === "important" ? "text-amber-600" :
                  "text-blue-600"
                }`} />
              </div>
              <div>
                <h3 className="font-bold text-[#1F2937] text-lg">{selectedAnnouncement.title}</h3>
                <p className="text-sm text-[#6B7280]">
                  {new Date(selectedAnnouncement.createdAt).toLocaleDateString("az-AZ")}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowPreview(false); setSelectedAnnouncement(null); }}
              icon={<X className="w-4 h-4" />}
            >
              Bağla
            </Button>
          </div>
          <div className="prose max-w-none">
            <p className="text-[#1F2937] whitespace-pre-wrap">{selectedAnnouncement.message}</p>
          </div>
        </Card>
      )}

      {/* Список объявлений */}
      {!showForm && !showPreview && (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Başlıq</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Prioritet</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Tarix</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {announcements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#6B7280]">
                    Elan yoxdur
                  </td>
                </tr>
              ) : (
                announcements.map((announcement) => {
                  const reads = JSON.parse(localStorage.getItem("decor_announcement_reads") || "[]");
                  const readCount = reads.filter((r: AnnouncementRead) => r.announcementId === announcement.id).length;
                  
                  return (
                    <tr key={announcement.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-[#1F2937]">{announcement.title}</p>
                        <p className="text-xs text-[#6B7280] line-clamp-1">{announcement.message}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                          {getPriorityLabel(announcement.priority)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-[#6B7280]">
                          <p>{new Date(announcement.createdAt).toLocaleDateString("az-AZ")}</p>
                          {announcement.expiresAt && (
                            <p className="text-xs">
                              Bitir: {new Date(announcement.expiresAt).toLocaleDateString("az-AZ")}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          announcement.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}>
                          {announcement.isActive ? "Aktiv" : "Qeyri-aktiv"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handlePreview(announcement)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                            title="Bax"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleActive(announcement.id)}
                            className={`p-2 rounded ${
                              announcement.isActive ? "text-amber-500 hover:bg-amber-50" : "text-green-500 hover:bg-green-50"
                            }`}
                            title={announcement.isActive ? "Deaktiv et" : "Aktiv et"}
                          >
                            {announcement.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleEdit(announcement)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                            title="Redaktə"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(announcement.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}