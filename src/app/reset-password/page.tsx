"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/authApi";
import { ArrowLeft, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token tapılmadı. Zəhmət olmasa emaildəki linki istifadə edin.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Şifrə ən azı 6 simvol olmalıdır");
      return;
    }

    if (password !== confirmPassword) {
      setError("Şifrələr uyğun gəlmir");
      return;
    }

    setLoading(true);

    try {
      await (authApi as any).resetPassword(token!, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1F2937] to-[#111827] flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#1F2937] mb-2">Şifrə Dəyişdirildi!</h1>
          <p className="text-[#6B7280] mb-6">
            Şifrəniz uğurla dəyişdirildi. İndi yeni şifrəniz ilə giriş edə bilərsiniz.
          </p>
          <Button onClick={() => router.push("/login")} className="w-full">
            Giriş Səhifəsinə Get
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1F2937] to-[#111827] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#1F2937] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#D90429]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-[#D90429]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Yeni Şifrə</h1>
          <p className="text-[#6B7280] mt-2">
            Yeni şifrənizi daxil edin
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              label="Yeni Şifrə"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[38px] text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <Input
              type={showConfirm ? "text" : "password"}
              label="Şifrəni Təkrar Et"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-[38px] text-gray-400 hover:text-gray-600"
            >
              {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <Button type="submit" className="w-full" loading={loading} disabled={!token}>
            Dəyişdir
          </Button>
        </form>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          Şifrənizi xatırlayırsınız?{" "}
          <Link href="/login" className="text-[#D90429] hover:underline font-medium">
            Giriş edin
          </Link>
        </p>
      </Card>
    </div>
  );
}
