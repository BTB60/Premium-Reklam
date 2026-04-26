"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/authApi";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { RealtimeNotificationsHost } from "@/components/realtime/RealtimeNotificationsHost";
import { ServerNotificationsMarkAllButton } from "@/components/realtime/ServerNotificationsMarkAllButton";
import { Button } from "@/components/ui/Button";
import { LogOut, RefreshCw } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const checkSession = () => {
      if (typeof window === "undefined") return;
      
      let currentUser = (authApi as any).getCurrentUser?.() || null;
      
      if (!currentUser) {
        try {
          const raw = localStorage.getItem("decor_current_user");
          if (raw) {
            currentUser = JSON.parse(raw);
          }
        } catch (e) {
          console.warn("[DashboardLayout] Failed to parse session:", e);
        }
      }
      
      if (!currentUser) {
        router.push("/login");
        return;
      }
      
      if (currentUser.role === "ADMIN") {
        router.push("/admin/dashboard");
        return;
      }
      
      setUser(currentUser);
    };
    
    const timer = setTimeout(checkSession, 50);
    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    const onOrderStatus = () => {
      const fn = (window as unknown as { __userOrdersRefresh?: () => void }).__userOrdersRefresh;
      if (typeof fn === "function") fn();
    };
    window.addEventListener("premium:refresh-user-orders", onOrderStatus);
    return () => window.removeEventListener("premium:refresh-user-orders", onOrderStatus);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("decor_current_user");
      localStorage.removeItem("premium_session_type");
    }
    authApi.logout();
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E5E7EB] border-t-[#D90429] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-[var(--card-glass)] backdrop-blur-md border-b border-[var(--border)] px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#ff6600] to-[#dc5500] shadow-[0_0_18px_rgba(255,102,0,0.3)] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)]">Premium Reklam</h1>
              <p className="text-xs text-[var(--text-muted)]">Xoş gəldin, {user.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ServerNotificationsMarkAllButton className="hidden sm:inline" />
            <NotificationBell />
            <Button variant="ghost" size="sm" onClick={handleRefresh} icon={<RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />}>
              <span className="sr-only">Yenilə</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} icon={<LogOut className="w-4 h-4" />}>
              Çıxış
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {children}
      </main>
      <RealtimeNotificationsHost />
    </div>
  );
}