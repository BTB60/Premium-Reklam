"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/authApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Shield, Lock, ArrowRight, AlertTriangle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Пробуем войти через бэкенд
      const user = await authApi.login(username, password);
      
      // Явно сохраняем в localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("decor_current_user", JSON.stringify(user));
        console.log("[Login] Saved user:", user);
      }
      
      // Редирект с небольшой задержкой, чтобы localStorage успел записаться
      setTimeout(() => {
        router.push("/admin/dashboard");
        router.refresh();
      }, 100);
      
    } catch (err: any) {
      console.error("[Login] Error:", err);
      setError(err.message || "Не удалось войти");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1F2937] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Card className="p-8 border-2 border-[#D90429]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#D90429]/10 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#D90429]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1F2937]">Admin Girişi</h1>
              <p className="text-sm text-[#6B7280]">Premium Reklam Panel</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="İstifadəçi adı"
              placeholder="admin"
              value={username}
              onChange={setUsername}
              icon={<Shield className="w-5 h-5" />}
              required
              disabled={loading}
            />

            <Input
              label="Parol"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
              icon={<Lock className="w-5 h-5" />}
              required
              disabled={loading}
            />

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Daxil ol
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-[#9CA3AF]">
            Test: admin / admin123
          </div>
        </Card>
      </div>
    </div>
  );
}