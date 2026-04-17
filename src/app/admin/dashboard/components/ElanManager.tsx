// src/app/admin/dashboard/components/ElanManager.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Megaphone, Plus, Save, X, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { announcementApi, type Announcement } from "@/lib/authApi/announcements";

const getTodayString = () => {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().split("T")[0];
};

export default function ElanManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({ 
    title: "", 
    message: "", 
    priority: "normal" as const, 
    isActive: true, 
    expiresAt: getTodayString() 
  });

  // ✅ Вынесена загрузка в отдельную функцию с улучшенной обработкой ошибок
  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await announcementApi.getAll();
      // Гарантируем, что данные — массив
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (e: any) {
      // Если даже фоллбэк не сработал — показываем пустой список, но не крашим интерфейс
      console.warn("[ElanManager] Fallback failed:", e);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAnnouncements(); }, [loadAnnouncements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!formData.title.trim() || !formData.message.trim()) {
      setError("Başlıq və mətn lazımdır");
      return;
    }
    
    try {
      const expiresAtValue = formData.expiresAt ? `${formData.expiresAt}T00:00:00` : null;
      
      await announcementApi.create({
        title: formData.title.trim(),
        message: formData.message.trim(),
        priority: formData.priority,
        isActive: formData.isActive,
        expiresAt: expiresAtValue,
        createdBy: "Admin"
      });
      
      setSuccess("Elan uğurla yaradıldı");
      await loadAnnouncements();
      setShowForm(false);
      setFormData({ title: "", message: "", priority: "normal", isActive: true, expiresAt: getTodayString() });
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError("Xəta: " + (e.message || "Yadda saxlama uğursuz oldu"));
    }
  };

  const handleToggleActive = async (id: string | number, current: boolean) => {
    try {
      await announcementApi.update(id, { isActive: !current });
      await loadAnnouncements();
    } catch (e: any) {
      setError("Status dəyişmədi: " + (e.message || ""));
    }
  };

  // ✅ ИСПРАВЛЕНА ФУНКЦИЯ УДАЛЕНИЯ
  const handleDelete = async (id: string | number) => {
    if (!confirm("Bu elanı silmək istədiyinizə əminsiniz?")) return;
    
    // Оптимистичное обновление: сразу удаляем из стейта для мгновенного отклика
    setAnnouncements(prev => prev.filter(a => String(a.id) !== String(id)));
    
    try {
      // Пытаемся удалить через API (бэкенд или фоллбэк)
      const result = await announcementApi.delete(id);
      
      if (!result) {
        // Если удаление не подтвердилось — откатываем изменение и показываем ошибку
        await loadAnnouncements();
        setError("Silinmə təsdiqlənmədi");
      } else {
        setSuccess("Elan silindi");
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch (e: any) {
      // При критической ошибке — перезагружаем список из надежного источника
      console.error("[ElanManager] Delete error:", e);
      await loadAnnouncements();
      setError("Silinmə xətası: " + (e.message || ""));
    }
  };

  if (loading && announcements.length === 0) {
    return <Card className="p-8 text-center text-[#6B7280]">Elanlar yüklənir...</Card>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-[#1F2937]">Elanlar</h1>
        <Button onClick={() => { setShowForm(true); setError(null); }} icon={<Plus className="w-4 h-4"/>}>
          Yeni Elan
        </Button>
      </div>

      {error && (
        <Card className="p-3 mb-3 bg-red-50 text-red-700 text-sm flex gap-2 items-center">
          <AlertCircle className="w-4 h-4 flex-shrink-0"/> 
          <span>{error}</span>
        </Card>
      )}
      
      {success && (
        <Card className="p-3 mb-3 bg-green-50 text-green-700 text-sm flex gap-2 items-center">
          <CheckCircle className="w-4 h-4 flex-shrink-0"/> 
          <span>{success}</span>
        </Card>
      )}
      
      {showForm && (
        <Card className="p-4 mb-4 border-2 border-[#D90429]/20">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm text-[#6B7280] mb-1">Başlıq *</label>
              <input 
                className="w-full p-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]/20" 
                placeholder="Elanın başlığı" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                required 
              />
            </div>
            <div>
              <label className="block text-sm text-[#6B7280] mb-1">Mətn *</label>
              <textarea 
                className="w-full p-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]/20" 
                placeholder="Elanın məzmunu" 
                rows={4} 
                value={formData.message} 
                onChange={e => setFormData({...formData, message: e.target.value})} 
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-[#6B7280] mb-1">Prioritet</label>
                <select 
                  className="w-full p-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]/20" 
                  value={formData.priority} 
                  onChange={e => setFormData({...formData, priority: e.target.value as any})}
                >
                  <option value="normal">Adi</option>
                  <option value="important">Vacib</option>
                  <option value="urgent">Təcili</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#6B7280] mb-1">Bitmə tarixi</label>
                <input 
                  type="date" 
                  className="w-full p-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]/20" 
                  value={formData.expiresAt} 
                  onChange={e => setFormData({...formData, expiresAt: e.target.value})} 
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="isActive" 
                checked={formData.isActive} 
                onChange={e => setFormData({...formData, isActive: e.target.checked})}
                className="rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm text-[#6B7280]">Dərhal aktivləşdir</label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" icon={<Save className="w-4 h-4"/>}>Yadda saxla</Button>
              <Button variant="ghost" onClick={() => setShowForm(false)} icon={<X className="w-4 h-4"/>}>Ləğv</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        {announcements.length === 0 ? (
          <div className="p-8 text-center text-[#6B7280]">
            <Megaphone className="w-12 h-12 mx-auto mb-3 text-gray-300"/>
            <p>Heç bir elan yoxdur</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-[#6B7280] font-medium">Başlıq</th>
                  <th className="p-3 text-left text-[#6B7280] font-medium">Prioritet</th>
                  <th className="p-3 text-left text-[#6B7280] font-medium">Tarix</th>
                  <th className="p-3 text-left text-[#6B7280] font-medium">Bitmə</th>
                  <th className="p-3 text-left text-[#6B7280] font-medium">Status</th>
                  <th className="p-3 text-right text-[#6B7280] font-medium">Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map(a => {
                  const isExpired = a.expiresAt && new Date(a.expiresAt) < new Date();
                  const priorityColors: Record<string, string> = {
                    normal: "bg-gray-100 text-gray-700",
                    important: "bg-orange-100 text-orange-700",
                    urgent: "bg-red-100 text-red-700"
                  };
                  const priorityLabel: Record<string, string> = {
                    normal: "Adi", important: "Vacib", urgent: "Təcili"
                  };
                  
                  return (
                    <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <div className="font-medium text-[#1F2937]">{a.title}</div>
                        <div className="text-xs text-[#6B7280] truncate max-w-[200px]">{a.message}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[a.priority.toLowerCase()] || priorityColors.normal}`}>
                          {priorityLabel[a.priority.toLowerCase()] || a.priority}
                        </span>
                      </td>
                      <td className="p-3 text-[#6B7280]">
                        {new Date(a.createdAt).toLocaleDateString("az-AZ")}
                      </td>
                      <td className="p-3 text-[#6B7280]">
                        {a.expiresAt 
                          ? new Date(a.expiresAt).toLocaleDateString("az-AZ") 
                          : <span className="text-xs text-gray-400">—</span>
                        }
                        {isExpired && <span className="ml-1 text-xs text-red-500">(bitib)</span>}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleActive(a.id, a.isActive)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            a.isActive && !isExpired
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          {a.isActive && !isExpired ? "Aktiv" : "Qeyri-aktiv"}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          {/* ✅ Кнопка удаления с исправленной логикой */}
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </div>
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
  );
}