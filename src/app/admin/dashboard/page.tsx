"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/authApi";
import DashboardLayout from "./components/DashboardLayout";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

type ActiveTab = "dashboard" | "users" | "orders" | "shops" | "elan" | "homeCarousel" | "homePromo" | "notifications" | "analytics" | "products" | "userPrices" | "finance" | "inventory" | "workerTasks" | "support" | "settings" | "tasks" | "accessSettings" | "auditLogs";

interface SubadminSession {
  subadminId: string;
  login: string;
  role: "SUBADMIN";
  permissions: Record<string, "none" | "view" | "edit">;
  lastLogin?: string;
}

function normalizeRole(raw?: string): string {
  const role = String(raw || "").trim().toUpperCase();
  if (role.startsWith("ROLE_")) return role.slice(5);
  return role;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [subadminSession, setSubadminSession] = useState<SubadminSession | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string>("");

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
          const parsed = JSON.parse(adminSession) as { token?: string; role?: string; fullName?: string };
          const normalizedRole = normalizeRole(parsed?.role);
          const isMockToken = String(parsed?.token || "").startsWith("mock.");
          console.log("[Dashboard] Parsed admin session:", parsed);
          if (parsed?.token && parsed?.role && !isMockToken) {
            if (normalizedRole === "ADMIN") {
              console.log("[Dashboard] Loading as ADMIN:", parsed.fullName);
              setUser(parsed);
              setLoading(false);
              return;
            }
            console.warn("[Dashboard] Admin session has wrong role:", parsed.role);
          }
          if (isMockToken) {
            console.warn("[Dashboard] Mock token detected; forcing re-login with backend auth");
            localStorage.removeItem("decor_current_user");
          }
        } catch (e) {
          console.error("[Dashboard] Admin parse error:", e);
          localStorage.removeItem("decor_current_user");
          localStorage.removeItem("premium_session_type");
        }
      }

      console.warn("[Dashboard] No valid session, redirecting to login");
      setAuthError("Sessiya tapılmadı və ya etibarsızdır. Yenidən daxil olun.");
      setLoading(false);
      router.push("/admin/login");
    } catch (error) {
      console.error("[Dashboard] Init error:", error);
      setAuthError("Sessiya yoxlanışı zamanı xəta baş verdi. Yenidən daxil olun.");
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

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center shadow-lg">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Admin sessiyası aktiv deyil</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {authError || "Dashboard-a daxil olmaq üçün yenidən login edin."}
          </p>
          <div className="mt-5 flex justify-center">
            <Link href="/admin/login">
              <Button size="sm">Admin login səhifəsinə keç</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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