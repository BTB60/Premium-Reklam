"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Phone, Lock, User, ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    phone: "",
    companyName: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Şifrələr uyğun gəlmir");
      }

      if (formData.password.length < 6) {
        throw new Error("Şifrə ən azı 6 simvol olmalıdır");
      }

      // Register via API
      const user = await api.register({
        fullName: formData.fullName,
        username: formData.username,
        phone: formData.phone,
        password: formData.password,
      });

      console.log("User registered:", user);
      router.push("/login?registered=true");
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
            <h1 className="text-2xl font-bold text-[#1F2937] mb-2">Qeydiyyat</h1>
            <p className="text-[#6B7280]">
              Yeni hesab yaradın
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Ad və Soyad"
              placeholder="Adınızı daxil edin"
              value={formData.fullName}
              onChange={(value) => setFormData({ ...formData, fullName: value })}
              icon={<User className="w-5 h-5" />}
              required
            />

            <Input
              label="İstifadəçi adı"
              placeholder="istifadeci123"
              value={formData.username}
              onChange={(value) => setFormData({ ...formData, username: value })}
              icon={<User className="w-5 h-5" />}
              required
            />

            <Input
              label="Telefon nömrəsi"
              placeholder="+994 50 123 45 67"
              value={formData.phone}
              onChange={(value) => setFormData({ ...formData, phone: value })}
              icon={<Phone className="w-5 h-5" />}
              required
            />

            <Input
              label="Şirkət adı (isteğe bağlı)"
              placeholder="Şirkət adı"
              value={formData.companyName}
              onChange={(value) => setFormData({ ...formData, companyName: value })}
              icon={<Building2 className="w-5 h-5" />}
            />

            <Input
              label="Şifrə"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(value) => setFormData({ ...formData, password: value })}
              icon={<Lock className="w-5 h-5" />}
              required
            />

            <Input
              label="Şifrəni təsdiqlə"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(value) => setFormData({ ...formData, confirmPassword: value })}
              icon={<Lock className="w-5 h-5" />}
              required
            />

            <div className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1 rounded border-[#E5E7EB]" required />
              <span className="text-[#6B7280]">
                <Link href="/terms" className="text-[#D90429] hover:underline">İstifadə şərtləri</Link> və{" "}
                <Link href="/privacy" className="text-[#D90429] hover:underline">Məxfilik siyasəti</Link> ilə razıyam
              </span>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Qeydiyyatdan keç
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#6B7280]">
              Artıq hesabınız var?{" "}
              <Link href="/login" className="text-[#D90429] font-medium hover:underline">
                Daxil olun
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
