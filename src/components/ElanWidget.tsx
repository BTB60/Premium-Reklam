"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Megaphone, X, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  message: string;
  isActive: boolean;
  priority: "normal" | "important" | "urgent";
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
}

interface AnnouncementRead {
  announcementId: number;
  userId: string;
  readAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : 'https://premium-reklam-backend.onrender.com/api';
const STORAGE_KEY_ANNOUNCEMENTS = "decor_announcements";
const STORAGE_KEY_READS = "decor_announcement_reads";
const STORAGE_KEY_LAST_FETCH = "decor_announcements_last_fetch";
// 🔥 Уменьшили TTL с 5 мин до 30 сек для быстрой кросс-браузерной синхронизации
const CACHE_TTL_MS = 30 * 1000;

// 🔥 BroadcastChannel для мгновенной синхронизации внутри одного браузера
const broadcastChannel = typeof window !== "undefined" ? new BroadcastChannel("announcements") : null;

export default function ElanWidget() {
  const [showElan, setShowElan] = useState(false);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkForNewAnnouncement();

    // 🔥 Слушаем BroadcastChannel (мгновенно, внутри одного браузера)
    const handleBroadcast = (event: MessageEvent) => {
      if (event.data?.action === "refresh") {
        checkForNewAnnouncement();
      }
    };
    broadcastChannel?.addEventListener("message", handleBroadcast);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_ANNOUNCEMENTS || e.key === STORAGE_KEY_READS) {
        checkForNewAnnouncement();
      }
    };

    const handleFocus = () => {
      checkForNewAnnouncement();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);
    
    return () => {
      broadcastChannel?.removeEventListener("message", handleBroadcast);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const getCurrentUser = () => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("decor_current_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.id || parsed?.username || null;
      }
    } catch {}
    return null;
  };

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  };

  const isCacheValid = () => {
    const lastFetch = localStorage.getItem(STORAGE_KEY_LAST_FETCH);
    if (!lastFetch) return false;
    return Date.now() - parseInt(lastFetch) < CACHE_TTL_MS;
  };

  const fetchFromAPI = async (): Promise<Announcement[] | null> => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE}/announcements/active`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` }),
        },
        cache: "no-store",
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return null;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data: Announcement[] = await response.json();
      localStorage.setItem(STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(data));
      localStorage.setItem(STORAGE_KEY_LAST_FETCH, Date.now().toString());
      return data;
    } catch (error) {
      console.warn("[ElanWidget] API fetch failed, using localStorage fallback:", error);
      return null;
    }
  };

  const checkReadStatusAPI = async (announcementId: number): Promise<boolean> => {
    try {
      const token = getAuthToken();
      const userId = getCurrentUser();
      
      if (!token || !userId) return false;
      
      const response = await fetch(`${API_BASE}/announcements/${announcementId}/read-status`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        return await response.json();
      }
      return false;
    } catch {
      return false;
    }
  };

  const markAsReadAPI = async (announcementId: number): Promise<boolean> => {
    try {
      const token = getAuthToken();
      if (!token) return false;
      
      const response = await fetch(`${API_BASE}/announcements/${announcementId}/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      
      return response.ok;
    } catch {
      return false;
    }
  };

  const checkForNewAnnouncement = async () => {
    setIsLoading(true);
    
    let announcements: Announcement[] | null = null;
    
    // 🔥 При получении сигнала от BroadcastChannel — всегда идём в API
    const lastFetch = localStorage.getItem(STORAGE_KEY_LAST_FETCH);
    const forceRefresh = !lastFetch;
    
    if (forceRefresh || !isCacheValid()) {
      announcements = await fetchFromAPI();
    }
    
    if (!announcements) {
      const stored = localStorage.getItem(STORAGE_KEY_ANNOUNCEMENTS);
      if (stored) {
        try {
          announcements = JSON.parse(stored);
        } catch (e) {
          console.error("[ElanWidget] Parse error:", e);
        }
      }
    }
    
    if (!announcements || announcements.length === 0) {
      setIsLoading(false);
      return;
    }

    const active = announcements.filter(a => a.isActive);
    if (active.length === 0) {
      setIsLoading(false);
      return;
    }

    const latest = active.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    const userId = getCurrentUser();
    const token = getAuthToken();
    
    let hasRead = false;
    
    // 🔥 Приоритет: проверяем через API, если есть токен
    if (token && userId) {
      hasRead = await checkReadStatusAPI(latest.id);
    }
    
    // 🔥 Fallback: проверяем localStorage
    if (!hasRead) {
      const reads: AnnouncementRead[] = JSON.parse(localStorage.getItem(STORAGE_KEY_READS) || "[]");
      hasRead = reads.some(r => r.announcementId === latest.id && r.userId === userId);
    }

    const isExpired = latest.expiresAt && new Date(latest.expiresAt) < new Date();

    if (!hasRead && !isExpired) {
      setAnnouncement(latest);
      setHasUnread(true);
      setShowElan(true);
    }
    
    setIsLoading(false);
  };

  const handleMarkAsRead = async () => {
    if (!announcement) return;

    const userId = getCurrentUser();
    const token = getAuthToken();
    
    // 🔥 Отправляем на сервер, если есть авторизация
    if (token && userId) {
      const success = await markAsReadAPI(announcement.id);
      if (success) {
        setShowElan(false);
        setHasUnread(false);
        return;
      }
    }
    
    // 🔥 Fallback: localStorage
    const reads: AnnouncementRead[] = JSON.parse(localStorage.getItem(STORAGE_KEY_READS) || "[]");
    
    if (!reads.some(r => r.announcementId === announcement.id && r.userId === userId)) {
      reads.push({
        announcementId: announcement.id,
        userId: userId || "anonymous",
        readAt: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEY_READS, JSON.stringify(reads));
    }

    setShowElan(false);
    setHasUnread(false);
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "urgent") return "from-red-500 to-red-600";
    if (priority === "important") return "from-amber-500 to-amber-600";
    return "from-blue-500 to-blue-600";
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === "urgent") return <AlertCircle className="w-6 h-6 text-white" />;
    return <Megaphone className="w-6 h-6 text-white" />;
  };

  if (isLoading) {
    return (
      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" disabled>
        <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
      </button>
    );
  }

  if (!hasUnread) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={checkForNewAnnouncement}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Elanları yoxla"
        >
          <Megaphone className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowElan(true)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        title="Yeni elan var!"
      >
        <Megaphone className="w-5 h-5 text-gray-600" />
        <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      </button>

      {showElan && announcement && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className={`max-w-lg w-full overflow-hidden border-2 ${
            announcement.priority === "urgent" ? "border-red-500" :
            announcement.priority === "important" ? "border-amber-500" :
            "border-blue-500"
          }`}>
            <div className={`bg-gradient-to-r ${getPriorityColor(announcement.priority)} p-6 text-white`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getPriorityIcon(announcement.priority)}
                  <div>
                    <h2 className="font-bold text-xl">{announcement.title}</h2>
                    <p className="text-white/80 text-sm">
                      {new Date(announcement.createdAt).toLocaleDateString("az-AZ")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowElan(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-[#1F2937] whitespace-pre-wrap mb-6">{announcement.message}</p>
              <div className="flex gap-2">
                <Button
                  onClick={handleMarkAsRead}
                  className="flex-1"
                  icon={<CheckCircle className="w-4 h-4" />}
                >
                  Oxudum
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowElan(false)}
                  icon={<X className="w-4 h-4" />}
                >
                  Sonra
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}