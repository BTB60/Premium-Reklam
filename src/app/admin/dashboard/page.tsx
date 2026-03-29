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
  permissions: any;
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
      // 1. Проверяем сессию subadmin
      const storedSubadmin = typeof window !== "undefined" ? sessionStorage.getItem("premium_subadmin_session") : null;
      if (storedSubadmin) {
        try {
          const parsed = JSON.parse(storedSubadmin) as SubadminSession;
          if (parsed?.subadminId && parsed?.role === "SUBADMIN") {
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
        }
      }

      // 2. Проверяем сессию admin
      const stored = typeof window !== "undefined" ? localStorage.getItem("decor_current_user") : null;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.token && parsed?.role) {
            setUser(parsed);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("[Dashboard] Admin parse error:", e);
          localStorage.removeItem("decor_current_user");
        }
      }

      // 3. Нет сессии — редирект на логин
      router.push("/admin/login");
    } catch (error) {
      console.error("[Dashboard] Init error:", error);
      router.push("/admin/login");
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("decor_current_user");
      sessionStorage.removeItem("premium_subadmin_session");
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