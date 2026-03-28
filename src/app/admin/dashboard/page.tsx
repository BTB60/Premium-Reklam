"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/authApi";
import { Button } from "@/components/ui/Button";
import { LogOut } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Читаем пользователя из localStorage
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
      
      // Если не нашли — редирект на логин
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <header className="bg-[#1F2937] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold">Admin Panel</span>
            <span className="text-xs text-gray-400">({user.role})</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} icon={<LogOut className="w-4 h-4" />}>
            Çıxış
          </Button>
        </div>
      </header>
      
      <main className="p-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Xoş gəlmisiniz, {user.fullName}!</h1>
          <div className="space-y-2 text-[#6B7280]">
            <p><strong>ID:</strong> {user.userId}</p>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Roll:</strong> {user.role}</p>
          </div>
          <p className="mt-4 text-green-600 font-medium">✓ Giriş uğurlu oldu</p>
        </div>
      </main>
    </div>
  );
}