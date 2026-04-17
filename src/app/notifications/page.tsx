"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { announcementApi } from "@/lib/authApi";
import { Button } from "@/components/ui/Button";

interface Announcement {
  id: number;
  title: string;
  message: string;
  isActive: boolean;
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
  createdAt: string;
  expiresAt?: string;
}

const READ_IDS_KEY = "read_announcement_ids";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Безопасное чтение: всегда возвращаем массив строк
  const getReadIds = useCallback((): string[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(READ_IDS_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.map((id: any) => String(id)) : [];
    } catch { return []; }
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await announcementApi.getActive();
      const now = new Date();
      // Показываем всё активное
      const valid = list.filter((a: Announcement) => {
        if (!a.isActive) return false;
        // Убрал проверку expiresAt для показа в списке, если ты хочешь видеть историю
        // Если нужно скрывать истекшие - верни строку ниже:
        // if (a.expiresAt && new Date(a.expiresAt) < now) return false;
        return true;
      });
      valid.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(valid);
    } catch (e: any) {
      console.error("[NotificationsPage] Load error:", e);
      setError(e?.message || "Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // ✅ АВТО-МАРКИРОВКА: При загрузке страницы всё помечается прочитанным
  useEffect(() => {
    if (notifications.length > 0) {
      const read = getReadIds();
      let updated = false;
      notifications.forEach(n => {
        const idStr = String(n.id);
        if (!read.includes(idStr)) {
          read.push(idStr);
          updated = true;
        }
      });
      
      if (updated) {
        console.log("[Auto-Mark] Marking all as read:", read);
        localStorage.setItem(READ_IDS_KEY, JSON.stringify(read));
        // Оповещаем колокольчик
        window.dispatchEvent(new StorageEvent('storage', { key: READ_IDS_KEY }));
      }
    }
  }, [notifications, getReadIds]);

  // ✅ РУЧНАЯ МАРКИРОВКА ("Hamısını oxunmuş kimi qeyd et")
  const markAllAsRead = () => {
    if (notifications.length === 0) return;
    
    // Берем все ID из текущего списка и сохраняем их как прочитанные
    const allIds = notifications.map(n => String(n.id));
    console.log("[MarkAll] Saving all as read:", allIds);
    
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(allIds));
    window.dispatchEvent(new StorageEvent('storage', { key: READ_IDS_KEY }));
    
    // Обновляем UI (перезагружаем список или просто стейт)
    loadNotifications(); // Чтобы UI перерисовался (Oxunub)
  };

  const clearAllHistory = () => {
    // Если пользователь хочет удалить историю уведомлений (не путать с прочтением)
    if (confirm("Bütün bildirişləri silmək istəyirsiniz?")) {
      // Здесь логика удаления, если нужно. Сейчас просто обновляем.
      loadNotifications();
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "URGENT": return { bg: "bg-red-50", border: "border-red-200", icon: "text-red-600", badge: "bg-red-100 text-red-700" };
      case "IMPORTANT": return { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600", badge: "bg-amber-100 text-amber-700" };
      default: return { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600", badge: "bg-blue-100 text-blue-700" };
    }
  };

  const getPriorityLabel = (priority: string) => {
    if (priority === "URGENT") return "TƏCİLİ";
    if (priority === "IMPORTANT") return "VACİB";
    return "ADI";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Geri">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-[#1F2937]">Bildirişlər</h1>
          
          {/* ✅ Исправленная кнопка */}
          <button onClick={markAllAsRead} className="ml-auto text-sm text-[#D90429] hover:underline font-medium">
            Hamısını oxunmuş et
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#C41E3A] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500">Yüklənir...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Bildiriş yoxdur</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => {
              const styles = getPriorityStyles(n.priority);
              const readIds = getReadIds();
              const isRead = readIds.includes(String(n.id)); // ✅ Строгое сравнение строк
              
              return (
                <div key={n.id} className={`rounded-xl border ${styles.border} ${styles.bg} p-5 transition-all ${isRead ? "opacity-80" : "shadow-sm"}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${styles.bg}`}>
                      <Bell className={`w-5 h-5 ${styles.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-[#1F2937]">{n.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles.badge}`}>
                          {getPriorityLabel(n.priority)}
                        </span>
                        {isRead ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Oxunub
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#D90429] text-white font-medium">Yeni</span>
                        )}
                      </div>
                      <p className="text-[#4A4A4A] text-sm leading-relaxed whitespace-pre-wrap">{n.message}</p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                        <span>{new Date(n.createdAt).toLocaleString("az-AZ")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}