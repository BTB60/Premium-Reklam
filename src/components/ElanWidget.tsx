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

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : 'https://premium-reklam-backend.onrender.com/api';

export default function ElanWidget() {
  const [showElan, setShowElan] = useState(false);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    checkForNewAnnouncement();

    const handleFocus = () => {
      checkForNewAnnouncement();
    };
    window.addEventListener("focus", handleFocus);
    
    return () => {
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

  // 🔥 ЖЁСТКОЕ чтение ТОЛЬКО с бэкенда. Нет записи? — ошибка.
  const fetchActiveAnnouncements = async (): Promise<Announcement[] | null> => {
    setApiError(null);
    
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE}/announcements/active`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` }),
      },
      cache: "no-store",
    });
    
    if (!response.ok) {
      const msg = `API xətası: ${response.status}`;
      setApiError(msg);
      console.error("[ElanWidget] API error:", msg);
      return null;
    }
    
    const data: Announcement[] = await response.json();
    return data;
  };

  const checkReadStatusAPI = async (announcementId: number): Promise<boolean> => {
    const token = getAuthToken();
    const userId = getCurrentUser();
    
    if (!token || !userId) return false;
    
    try {
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
    const token = getAuthToken();
    if (!token) return false;
    
    try {
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
    
    const announcements = await fetchActiveAnnouncements();
    
    // 🔥 Если бэкенд не вернул данные — показываем ошибку, НЕ лезем в localStorage
    if (!announcements) {
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
    
    if (token && userId) {
      hasRead = await checkReadStatusAPI(latest.id);
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
    
    if (token && userId) {
      await markAsReadAPI(announcement.id);
    }

    setShowElan(false);
    setHasUnread(false);
    // 🔥 После прочтения — сразу перезапрашиваем с бэкенда
    await checkForNewAnnouncement();
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

  if (apiError) {
    return (
      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title={apiError}>
        <AlertCircle className="w-5 h-5 text-red-500" />
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