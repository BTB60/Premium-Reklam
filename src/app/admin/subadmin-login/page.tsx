"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Shield, Lock, ArrowRight, AlertTriangle, Key } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ========== SUBADMIN STORAGE HELPERS ==========
const SUBADMINS_KEY = "premium_subadmins";

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
  const stored = localStorage.getItem(SUBADMINS_KEY);
  return stored ? JSON.parse(stored) : [];
}

// ========== I18N ==========
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
  }
};

export default function SubadminLoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"az" | "en">("az");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const subadmins = getSubadmins();
      const subadmin = subadmins.find(s => s.login === login && s.password === password);

      if (!subadmin) {
        throw new Error("Invalid credentials");
      }

      localStorage.setItem("premium_subadmin_session", JSON.stringify(subadmin));
      
      subadmin.lastLogin = new Date().toISOString();
      localStorage.setItem(SUBADMINS_KEY, JSON.stringify(subadmins));

      router.push("/admin/dashboard");
    } catch {
      setError(lang === "az" ? t.az.error : t.en.error);
    } finally {
      setLoading(false);
    }
  };

  const ui = t[lang];

  return (
    <div className="min-h-screen bg-[#1F2937] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label={ui.login}
              placeholder="subadmin1"
              value={login}
              onChange={setLogin}
              icon={<Shield className="w-5 h-5" />}
              required
            />

            <Input
              label={ui.password}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
              icon={<Lock className="w-5 h-5" />}
              required
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
      </motion.div>
    </div>
  );
}