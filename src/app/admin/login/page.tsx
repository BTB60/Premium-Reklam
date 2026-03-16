"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Shield, Lock, ArrowRight, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/authApi";

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
      const user = await authApi.login(username, password);

      const role = user?.role?.toUpperCase();

      if (role !== "ADMIN") {
        throw new Error("Bu səhifəyə yalnız adminlər daxil ola bilər");
      }

      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1F2937] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 border-2 border-[#D90429]">
          {/* Admin Badge */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#D90429]/10 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-[#D90429]" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#1F2937] mb-2">Admin Panel</h1>
            <p className="text-[#6B7280]">
              Sistem idarəetməsi üçün daxil olun
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Admin istifadəçi adı"
              placeholder="admin"
              value={username}
              onChange={setUsername}
              icon={<Shield className="w-5 h-5" />}
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
            <Link
              href="/login"
              className="text-sm text-[#6B7280] hover:text-[#D90429] transition-colors"
            >
              ← İstifadəçi girişinə qayıt
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
