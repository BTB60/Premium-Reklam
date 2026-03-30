"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Megaphone, X, CheckCircle, AlertCircle } from "lucide-react";

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

export default function ElanWidget() {
  const [showElan, setShowElan] = useState(false);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    checkForNewAnnouncement();
  }, []);

  const getCurrentUser = () => {
    if (typeof window === "undefined") return "anonymous";
    try {
      const stored = localStorage.getItem("decor_current_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.username || parsed?.id || "anonymous";
      }
    } catch {}
    return "anonymous";
  };

  const checkForNewAnnouncement = () => {
    console.log("=== [ElanWidget] Checking for announcements ===");
    
    try {
      const stored = localStorage.getItem("decor_announcements");
      console.log("[ElanWidget] Raw announcements:", stored?.slice(0, 200) + "...");
      
      if (!stored) {
        console.log("[ElanWidget] No announcements found in localStorage");
        return;
      }

      const announcements: Announcement[] = JSON.parse(stored);
      console.log("[ElanWidget] Parsed announcements count:", announcements.length);
      console.log("[ElanWidget] Announcements:", announcements.map(a => ({
        id: a.id,
        title: a.title,
        isActive: a.isActive,
        createdAt: a.createdAt
      })));
      
      const active = announcements.filter(a => a.isActive);
      console.log("[ElanWidget] Active announcements:", active.length);
      
      if (active.length === 0) {
        console.log("[ElanWidget] No active announcements");
        return;
      }

      // Берём самое новое активное объявление
      const latest = active.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      console.log("[ElanWidget] Latest announcement:", {
        id: latest.id,
        title: latest.title,
        createdAt: latest.createdAt,
        expiresAt: latest.expiresAt
      });

      const userId = getCurrentUser();
      console.log("[ElanWidget] Current userId:", userId);
      
      const readsRaw = localStorage.getItem("decor_announcement_reads");
      console.log("[ElanWidget] Raw reads:", readsRaw?.slice(0, 200) + "...");
      
      const reads: AnnouncementRead[] = readsRaw ? JSON.parse(readsRaw) : [];
      console.log("[ElanWidget] Parsed reads count:", reads.length);
      
      // Проверяем, читал ли пользователь это объявление
      const hasRead = reads.some(
        r => r.announcementId === latest.id && r.userId === userId
      );
      console.log("[ElanWidget] Has read this announcement:", hasRead);

      // Проверяем срок действия
      const isExpired = latest.expiresAt && new Date(latest.expiresAt) < new Date();
      console.log("[ElanWidget] Is expired:", isExpired, "expiresAt:", latest.expiresAt);

      if (!hasRead && !isExpired) {
        console.log("[ElanWidget] ✓ Showing announcement!");
        setAnnouncement(latest);
        setHasUnread(true);
        setShowElan(true);
      } else {
        console.log("[ElanWidget] ✗ Not showing: hasRead=", hasRead, "isExpired=", isExpired);
      }
    } catch (error) {
      console.error("[ElanWidget] Check error:", error);
    }
    
    console.log("=== [ElanWidget] End check ===");
  };

  const handleMarkAsRead = () => {
    if (!announcement) return;

    const userId = getCurrentUser();
    const reads: AnnouncementRead[] = JSON.parse(localStorage.getItem("decor_announcement_reads") || "[]");
    
    const newRead: AnnouncementRead = {
      announcementId: announcement.id,
      userId,
      readAt: new Date().toISOString(),
    };

    reads.push(newRead);
    localStorage.setItem("decor_announcement_reads", JSON.stringify(reads));
    console.log("[ElanWidget] Marked as read:", newRead);

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

  if (!hasUnread) {
    return (
      <button
        onClick={checkForNewAnnouncement}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        title="Elanlar"
      >
        <Megaphone className="w-5 h-5 text-gray-600" />
      </button>
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