"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/authApi";
import DashboardLayout from "./components/DashboardLayout";

// 🔥 ДОБАВЛЕНО: "elan" в тип ActiveTab
type ActiveTab = "dashboard" | "users" | "orders" | "shops" | "elan" | "notifications" | "analytics" | "products" | "finance" | "inventory" | "workerTasks" | "support" | "settings" | "tasks" | "accessSettings" | "auditLogs";

interface SubadminSession {
  subadminId: string;
  login: string;
  role: "SUBADMIN";
  permissions: Record<string, "none" | "view" | "edit">;
  lastLogin?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [subadminSession, setSubadminSession] = useState<SubadminSession | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const sessionType = typeof window !== "undefined" ? localStorage.getItem("premium_session_type") : null;
      const adminSession = typeof window !== "undefined" ? localStorage.getItem("decor_current_user") : null;
      const subadminSessionStored = typeof window !== "undefined" ? sessionStorage.getItem("premium_subadmin_session") : null;
      
      console.log("[Dashboard] sessionType:", sessionType);
      console.log("[Dashboard] adminSession:", adminSession);
      console.log("[Dashboard] subadminSession:", subadminSessionStored);

      if (sessionType === "subadmin" && subadminSessionStored) {
        try {
          const parsed = JSON.parse(subadminSessionStored) as SubadminSession;
          if (parsed?.subadminId && parsed?.role === "SUBADMIN") {
            console.log("[Dashboard] Loading as SUBADMIN:", parsed.login);
            setSubadminSession(parsed);
            setUser({
              role: "SUBADMIN",
              fullName: parsed.login,
              permissions: parsed.permissions,
            });
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("[Dashboard] Subadmin parse error:", e);
          sessionStorage.removeItem("premium_subadmin_session");
          localStorage.removeItem("premium_session_type");
        }
      }

      // Admin: must run even when premium_session_type was "subadmin" but invalid / cleared above
      if (adminSession) {
        try {
          const parsed = JSON.parse(adminSession);
          console.log("[Dashboard] Parsed admin session:", parsed);
          if (parsed?.token && parsed?.role) {
            if (parsed.role === "ADMIN") {
              console.log("[Dashboard] Loading as ADMIN:", parsed.fullName);
              setUser(parsed);
              setLoading(false);
              return;
            }
            console.warn("[Dashboard] Admin session has wrong role:", parsed.role);
          }
        } catch (e) {
          console.error("[Dashboard] Admin parse error:", e);
          localStorage.removeItem("decor_current_user");
          localStorage.removeItem("premium_session_type");
        }
      }

      console.warn("[Dashboard] No valid session, redirecting to login");
      setLoading(false);
      router.push("/admin/login");
    } catch (error) {
      console.error("[Dashboard] Init error:", error);
      setLoading(false);
      router.push("/admin/login");
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      const sessionType = localStorage.getItem("premium_session_type");
      if (sessionType === "subadmin") {
        sessionStorage.removeItem("premium_subadmin_session");
      } else {
        localStorage.removeItem("decor_current_user");
      }
      localStorage.removeItem("premium_session_type");
    }
    authApi.logout();
    router.push("/admin/login");
  };

  // 🔥 Обёртка для совместимости типов
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--text-primary)] text-lg animate-pulse">Yüklənir...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout
      user={user}
      subadminSession={subadminSession}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onLogout={handleLogout}
    />
  );
}