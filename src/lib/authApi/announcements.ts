// src/lib/authApi/announcements.ts

import { getFromStorage, saveToStorage } from "@/lib/db/storage";

export interface Announcement {
  id: string | number;
  title: string;
  message: string;
  isActive: boolean;
  priority: "NORMAL" | "IMPORTANT" | "URGENT" | "normal" | "important" | "urgent";
  createdAt: string;
  expiresAt?: string | null;
  createdBy?: string;
}

const ANNOUNCEMENTS_KEY = "decor_announcements";

const getAnnouncements = (): Announcement[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ANNOUNCEMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveAnnouncements = (announcements: Announcement[]) => {
  if (typeof window === "undefined") return;
  saveToStorage(ANNOUNCEMENTS_KEY, announcements);
};

const getApiUrl = (endpoint: string) => {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  return `${base}/api${endpoint}`;
};

const getAuthHeaders = () => {
  if (typeof window === "undefined") return {};
  const userStr = localStorage.getItem("decor_current_user");
  if (!userStr) return { "Content-Type": "application/json" };
  try {
    const user = JSON.parse(userStr);
    return {
      "Content-Type": "application/json",
      ...(user?.token ? { "Authorization": `Bearer ${user.token}` } : {})
    };
  } catch {
    return { "Content-Type": "application/json" };
  }
};

export const announcementApi = {
  /**
   * ТОЛЬКО ДЛЯ ПОЛЬЗОВАТЕЛЕЙ: Получение активных объявлений
   */
  getActive: async () => {
    try {
      const res = await fetch(getApiUrl("/announcements/active"), {
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error("Backend unavailable");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      const all = getAnnouncements();
      const now = new Date().getTime();
      
      return all.filter((a: Announcement) => {
        const active = a.isActive === true || a.isActive === "true";
        if (!active) return false;
        
        if (a.expiresAt) {
          const exp = new Date(a.expiresAt).getTime();
          if (isNaN(exp) || exp < now) return false;
        }
        
        return true;
      });
    }
  },

  /**
   * Для админки: все объявления
   */
  getAll: async () => {
    try {
      const res = await fetch(getApiUrl("/announcements"), {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Backend unavailable");
      return await res.json();
    } catch {
      return getAnnouncements();
    }
  },

  /**
   * ✅ ИСПРАВЛЕНО: добавлен аргумент data
   */
  create: async (data: Omit<Announcement, "id" | "createdAt">) => {
    try {
      const res = await fetch(getApiUrl("/announcements"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...data,
          priority: (data.priority || "normal").toUpperCase()
        })
      });
      if (!res.ok) throw new Error(`Backend error ${res.status}`);
      return await res.json();
    } catch {
      const all = getAnnouncements();
      const newAnnouncement: Announcement = {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        priority: ((data.priority || "normal").toUpperCase()) as Announcement["priority"]
      };
      all.unshift(newAnnouncement);
      saveAnnouncements(all);
      return newAnnouncement;
    }
  },

  update: async (id: string | number, updates: Partial<Announcement>) => {
    try {
      const res = await fetch(getApiUrl(`/announcements/${id}`), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error("Backend unavailable");
      return await res.json();
    } catch {
      const all = getAnnouncements();
      const index = all.findIndex((a: Announcement) => String(a.id) === String(id));
      if (index === -1) return null;
      all[index] = { ...all[index], ...updates };
      saveAnnouncements(all);
      return all[index];
    }
  },

  delete: async (id: string | number) => {
    try {
      const res = await fetch(getApiUrl(`/announcements/${id}`), {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (!res.ok) console.warn(`[announcementApi] Backend delete failed: ${res.status}`);
    } catch (e) {
      console.warn("[announcementApi] Backend unavailable during delete");
    }
    
    const all = getAnnouncements().filter((a: Announcement) => String(a.id) !== String(id));
    saveAnnouncements(all);
    return true;
  },
};