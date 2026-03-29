"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/authApi";
import DashboardLayout from "./components/DashboardLayout";

type ActiveTab = "dashboard" | "users" | "orders" | "notifications" | "analytics" | "products" | "finance" | "inventory" | "workerTasks" | "support" | "settings" | "tasks" | "accessSettings";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
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
          console.error("[Dashboard] Parse error:", e);
          localStorage.removeItem("decor_current_user");
        }
      }
      router.push("/admin/login");
    } catch (error) {
      console.error("[Dashboard] Init error:", error);
      router.push("/admin/login");
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("decor_current_user");
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
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    />
  );
}