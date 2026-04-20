"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Shield, Lock, ArrowRight, AlertTriangle, Key } from "lucide-react";
import Link from "next/link";
import { subadminAuth } from "@/lib/subadminAuth";

const SUBADMINS_KEY = "premium_subadmins";
const SUBADMIN_SESSION_KEY = "premium_subadmin_session";

interface SubadminPermissions {
  users: "none" | "view" | "edit";
  orders: "none" | "view" | "edit";
  finance: "none" | "view" | "edit";
  products: "none" | "view" | "edit";
  inventory: "none" | "view" | "edit";
  tasks: "none" | "view" | "edit";
  support: "none" | "view" | "edit";
  analytics: "none" | "view" | "edit";
  settings: "none" | "view" | "edit";
}

interface Subadmin {
  id: string;
  login: string;
  password: string;
  permissions: SubadminPermissions;
  createdAt: string;
  lastLogin?: string;
}

function getSubadmins(): Subadmin[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(SUBADMINS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function SubadminLoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lang, setLang] = useState<"az" | "en">("az");
  const [debugInfo, setDebugInfo] = useState<string>("");

  // 🔥 Отладка: покажем, какие subadmin-ы есть в localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const subs = getSubadmins();
      setDebugInfo(`Найдено subadmin-ов: ${subs.length}\n${subs.map(s => `• ${s.login}`).join("\n") || "Пусто"}`);
      console.log("[SubadminLogin] Available subadmins:", subs);
    }
  }, []);

  const t = {
    az: {
      title: "Subadmin Girişi",
      subtitle: "Məhdud icazələrlə panelə daxil olun",
      login: "Login",
      password: "Parol",
      submit: "Daxil ol",
      error: "Login və ya parol yanlışdır",
      back: "← Əsas admin girişinə qayıt",
      lang: "AZ",
    },
    en: {
      title: "Subadmin Login",
      subtitle: "Sign in with limited permissions",
      login: "Login",
      password: "Password",
      submit: "Sign in",
      error: "Invalid login or password",
      back: "← Back to main admin login",
      lang: "EN",
    },
  };

  const ui = t[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 🔥 Нормализуем ввод
    const inputLogin = login.trim();
    const inputPassword = password.trim();

    console.log("[SubadminLogin] Attempting login:", { inputLogin, inputPassword });

    try {
      // 1) Backend JWT — panel API-ləri Authorization tələb edir
      const backendSession = await subadminAuth.login(inputLogin, inputPassword);

      const session = {
        subadminId: String(backendSession.subadminId),
        login: backendSession.login,
        role: "SUBADMIN" as const,
        permissions: backendSession.permissions,
        lastLogin: new Date().toISOString(),
      };

      if (typeof window !== "undefined") {
        localStorage.removeItem("decor_current_user");
        localStorage.setItem("premium_session_type", "subadmin");
        sessionStorage.setItem(SUBADMIN_SESSION_KEY, JSON.stringify(session));
        console.log("[SubadminLogin] Backend session saved:", session.login);
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("[SubadminLogin] Error:", err);
      setError(typeof err?.message === "string" && err.message.trim() ? err.message : ui.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1F2937] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Card className="p-8 border-2 border-[#D90429]">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#D90429]/10 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#D90429]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1F2937]">{ui.title}</h1>
                <p className="text-sm text-[#6B7280]">{ui.subtitle}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLang(lang === "az" ? "en" : "az")}
              icon={<Key className="w-4 h-4" />}
            >
              {ui.lang}
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* 🔥 Отладочная панель (видна только в консоли, но можно раскомментировать для UI) */}
          {process.env.NODE_ENV === "development" && debugInfo && (
            <pre className="mb-4 p-3 bg-gray-100 rounded text-xs text-gray-700 overflow-auto max-h-32">
              {debugInfo}
            </pre>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label={ui.login}
              placeholder="subadmin1"
              value={login}
              onChange={(v) => setLogin(v)}
              icon={<Shield className="w-5 h-5" />}
              required
              disabled={loading}
            />

            <Input
              label={ui.password}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(v) => setPassword(v)}
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
              {ui.submit}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/admin/login"
              className="text-sm text-[#6B7280] hover:text-[#D90429] transition-colors"
            >
              {ui.back}
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}