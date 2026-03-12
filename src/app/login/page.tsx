"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { User, Lock, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Login via API
      const user = await api.login(username, password);

      // Save user to localStorage for session
      localStorage.setItem("currentUser", JSON.stringify(user));

      const role = user?.role?.toUpperCase();

      if (role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#1F2937] mb-2">Daxil ol</h1>
            <p className="text-[#6B7280]">
              Hesabınıza daxil olun
            </p>
          </div>

          {justRegistered && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Qeydiyyat uğurla tamamlandı! İndi daxil ola bilərsiniz.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="İstifadəçi adı"
              placeholder="istifadeci123"
              value={username}
              onChange={setUsername}
              icon={<User className="w-5 h-5" />}
              required
            />

            <Input
              label="Şifrə"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
              icon={<Lock className="w-5 h-5" />}
              required
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-[#E5E7EB]" />
                <span className="text-[#6B7280]">Məni xatırla</span>
              </label>
              <Link href="/forgot-password" className="text-[#D90429] hover:underline">
                Şifrəni unutdun?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Daxil ol
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#6B7280]">
              Hesabınız yoxdur?{" "}
              <Link href="/register" className="text-[#D90429] font-medium hover:underline">
                Qeydiyyatdan keç
              </Link>
            </p>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-[#6B7280] text-center">
            <p className="font-medium mb-1">Test üçün:</p>
            <p>Admin: <code className="bg-gray-100 px-1 rounded">admin</code> / <code className="bg-gray-100 px-1 rounded">admin123</code></p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D90429]" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
