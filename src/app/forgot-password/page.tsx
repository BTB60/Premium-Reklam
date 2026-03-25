"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/authApi";
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1F2937] to-[#111827] flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#1F2937] mb-2">Email Göndərildi!</h1>
          <p className="text-[#6B7280] mb-6">
            {email} ünvanına şifrə sıfırlama linki göndərildi.
            <br />
            Zəhmət olmasa emailinizi yoxlayın.
          </p>
          <Button onClick={() => router.push("/login")} className="w-full">
            Giriş Səhifəsinə Qayıt
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
            <Mail className="w-8 h-8 text-[#D90429]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Şifrəni Unutdum</h1>
          <p className="text-[#6B7280] mt-2">
            Emailinizi daxil edin, şifrə sıfırlama linki göndərək
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="email@ornek.com"
            required
          />

          <Button type="submit" className="w-full" loading={loading}>
            Göndər
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
