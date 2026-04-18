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
  expiresAt?: string;
}

const API_BASE = "https://premium-reklam-backend.onrender.com/api";

export default function ElanWidget() {
  const [showElan, setShowElan] = useState(false);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    checkForNewAnnouncement();
    const handleFocus = () => checkForNewAnnouncement();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // 🔥 Чтение ТОЛЬКО с бэкенда, БЕЗ токена
  const fetchActiveAnnouncements = async (): Promise<Announcement[] | null> => {
    setApiError(null);
    try {
      const response = await fetch(`${API_BASE}/announcements/active`, {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!response.ok) {
        setApiError(`API xətası: ${response.status}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("[ElanWidget] Fetch error:", error);
      setApiError("Bağlantı xətası");
      return null;
    }
  };

  const checkForNewAnnouncement = async () => {
    setIsLoading(true);
    const announcements = await fetchActiveAnnouncements();
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
    const isExpired = latest.expiresAt && new Date(latest.expiresAt) < new Date();
    // 🔥 Упрощено: показываем, если активно и не истекло (без трекинга прочтений для этой задачи)
    if (!isExpired) {
      setAnnouncement(latest);
      setHasUnread(true);
      setShowElan(true);
    }
    setIsLoading(false);
  };

  const handleMarkAsRead = () => {
    // 🔥 Просто закрываем — трекинг прочтений отключён для этой задачи
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
    return <button className="p-2 hover:bg-gray-100 rounded-full" disabled><RefreshCw className="w-5 h-5 text-gray-400 animate-spin" /></button>;
  }

  if (apiError) {
    return <button className="p-2 hover:bg-gray-100 rounded-full" title={apiError}><AlertCircle className="w-5 h-5 text-red-500" /></button>;
  }

  if (!hasUnread) {
    return (
      <div className="flex items-center gap-1">
        <button onClick={checkForNewAnnouncement} className="p-2 hover:bg-gray-100 rounded-full" title="Elanları yoxla">
          <Megaphone className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button onClick={() => setShowElan(true)} className="relative p-2 hover:bg-gray-100 rounded-full" title="Yeni elan var!">
        <Megaphone className="w-5 h-5 text-gray-600" />
        <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      </button>
      {showElan && announcement && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className={`max-w-lg w-full overflow-hidden border-2 ${announcement.priority === "urgent" ? "border-red-500" : announcement.priority === "important" ? "border-amber-500" : "border-blue-500"}`}>
            <div className={`bg-gradient-to-r ${getPriorityColor(announcement.priority)} p-6 text-white`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getPriorityIcon(announcement.priority)}
                  <div>
                    <h2 className="font-bold text-xl">{announcement.title}</h2>
                    <p className="text-white/80 text-sm">{new Date(announcement.createdAt).toLocaleDateString("az-AZ")}</p>
                  </div>
                </div>
                <button onClick={() => setShowElan(false)} className="p-1 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-[#1F2937] whitespace-pre-wrap mb-6">{announcement.message}</p>
              <div className="flex gap-2">
                <Button onClick={handleMarkAsRead} className="flex-1" icon={<CheckCircle className="w-4 h-4" />}>Oxudum</Button>
                <Button variant="ghost" onClick={() => setShowElan(false)} icon={<X className="w-4 h-4" />}>Sonra</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}