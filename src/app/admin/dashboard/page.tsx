"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/authApi";
import DashboardLayout from "./components/DashboardLayout";

type ActiveTab = "dashboard" | "users" | "orders" | "notifications" | "analytics" | "products" | "finance" | "inventory" | "workerTasks" | "support" | "settings" | "tasks" | "accessSettings";

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
      // 🔥 ЛОГИ: что в localStorage/sessionStorage
      const sessionType = typeof window !== "undefined" ? localStorage.getItem("premium_session_type") : null;
      const adminSession = typeof window !== "undefined" ? localStorage.getItem("decor_current_user") : null;
      const subadminSessionStored = typeof window !== "undefined" ? sessionStorage.getItem("premium_subadmin_session") : null;
      
      console.log("[Dashboard] sessionType:", sessionType);
      console.log("[Dashboard] adminSession:", adminSession);
      console.log("[Dashboard] subadminSession:", subadminSessionStored);

      // 1. Если сессия subadmin — загружаем её
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
      
      // 2. Если сессия admin — загружаем её
      if (sessionType === "admin" || !sessionType) {
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
              } else {
                console.warn("[Dashboard] Admin session has wrong role:", parsed.role);
              }
            }
          } catch (e) {
            console.error("[Dashboard] Admin parse error:", e);
            localStorage.removeItem("decor_current_user");
            localStorage.removeItem("premium_session_type");
          }
        }
      }

      // 3. Нет валидной сессии — редирект
      console.warn("[Dashboard] No valid session, redirecting to login");
      router.push("/admin/login");
    } catch (error) {
      console.error("[Dashboard] Init error:", error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1F2937] flex items-center justify-center">
        <div className="text-white text-lg">Yüklənir...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout
      user={user}
      subadminSession={subadminSession}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    />
  );
}