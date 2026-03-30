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

export default function ElanWidget() {
  const [showElan, setShowElan] = useState(false);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

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
    const stored = localStorage.getItem("decor_announcements");
    
    if (!stored) {
      if (debugMode) console.log("[ElanWidget] No data in localStorage");
      return;
    }

    try {
      const announcements: Announcement[] = JSON.parse(stored);
      const active = announcements.filter(a => a.isActive);
      if (active.length === 0) return;

      const latest = active.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      const userId = getCurrentUser();
      const reads: AnnouncementRead[] = JSON.parse(localStorage.getItem("decor_announcement_reads") || "[]");
      const hasRead = reads.some(r => r.announcementId === latest.id && r.userId === userId);
      const isExpired = latest.expiresAt && new Date(latest.expiresAt) < new Date();

      if (!hasRead && !isExpired) {
        setAnnouncement(latest);
        setHasUnread(true);
        setShowElan(true);
      }
    } catch (e) {
      if (debugMode) console.error("[ElanWidget] Parse error:", e);
    }
  };

  const handleMarkAsRead = () => {
    if (!announcement) return;
    const userId = getCurrentUser();
    const reads: AnnouncementRead[] = JSON.parse(localStorage.getItem("decor_announcement_reads") || "[]");
    reads.push({ announcementId: announcement.id, userId, readAt: new Date().toISOString() });
    localStorage.setItem("decor_announcement_reads", JSON.stringify(reads));
    setShowElan(false);
    setHasUnread(false);
  };

  const getPriorityColor = (p: string) => 
    p === "urgent" ? "from-red-500 to-red-600" : p === "important" ? "from-amber-500 to-amber-600" : "from-blue-500 to-blue-600";

  const getPriorityIcon = (p: string) => 
    p === "urgent" ? <AlertCircle className="w-6 h-6 text-white"/> : <Megaphone className="w-6 h-6 text-white"/>;

  if (!hasUnread) {
    return (
      <div className="flex items-center gap-1">
        <button onClick={() => setDebugMode(!debugMode)} className="p-2 hover:bg-gray-100 rounded" title="Debug">
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
        <button onClick={checkForNewAnnouncement} className="p-2 hover:bg-gray-100 rounded-full" title="Elanlar">
          <Megaphone className="w-5 h-5 text-gray-600" />
        </button>
        {debugMode && (
          <span className="text-xs text-gray-400 mr-2">
            {localStorage.getItem("decor_announcements") ? "✓ Data" : "✗ Empty"}
          </span>
        )}
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
                <button onClick={() => setShowElan(false)} className="p-1 hover:bg-white/20 rounded-full">
                  <X className="w-5 h-5" />
                </button>
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