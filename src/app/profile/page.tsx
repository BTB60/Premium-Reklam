"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import {
  User as UserIcon,
  Phone,
  Mail,
  Award,
  TrendingUp,
  Package,
  ArrowLeft,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import authApi, { orderApi, type UserData } from "@/lib/authApi";

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    const current = authApi.getCurrentUser();
    if (!current) {
      router.push("/login");
      return;
    }
    setSession(current);
    setFormData({
      fullName: current.fullName || "",
      phone: current.phone || "",
      email: current.email || "",
    });

    void (async () => {
      try {
        const profile = await authApi.getMyProfile();
        setFormData({
          fullName: profile.fullName || "",
          phone: profile.phone || "",
          email: profile.email || "",
        });
        const merged: UserData = {
          ...current,
          userId: profile.userId,
          fullName: profile.fullName,
          phone: profile.phone || undefined,
          email: profile.email || undefined,
          role: profile.role,
        };
        authApi.saveCurrentUser(merged);
        setSession(merged);
        setLoadError(null);
      } catch (e: any) {
        console.warn("[Profile] Server sync skipped:", e?.message || e);
        const msg = String(e?.message || "");
        setLoadError(
          msg.includes("401") || msg.includes("Token") || msg.includes("tələb olunur") || msg.includes("keçərsiz")
            ? "Sessiya yenilənməlidir — yenidən daxil olun."
            : null
        );
      }

      try {
        const summary = await orderApi.getMySummary();
        setOrderCount(summary.totalOrders || 0);
        setTotalSpent(summary.totalAmount || 0);
      } catch {
        setOrderCount(0);
        setTotalSpent(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const updated = await authApi.updateMyProfile({
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
      });
      const next: UserData = {
        ...session,
        userId: updated.userId,
        fullName: updated.fullName,
        phone: updated.phone || undefined,
        email: updated.email || undefined,
        role: updated.role,
      };
      authApi.saveCurrentUser(next);
      setSession(next);
      setFormData({
        fullName: updated.fullName || "",
        phone: updated.phone || "",
        email: updated.email || "",
      });
    } catch (error: any) {
      console.error("[Profile] Save error:", error);
      alert(error?.message || "Profil yenilənmədi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D90429]" />
      </div>
    );
  }

  if (!session) return null;

  const level = Math.min(99, 1 + Math.floor(orderCount / 3));

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Header />

      <main className="pt-20 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <Link href="/dashboard">
              <Button variant="ghost" icon={<ArrowLeft className="w-5 h-5" />}>
                Geri
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-[#1F2937]">Profilim</h1>
          </motion.div>

          {loadError && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {loadError}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-2"
            >
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-[#1F2937] mb-6 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-[#D90429]" />
                  Şəxsi məlumatlar
                </h2>

                <div className="space-y-5">
                  <Input
                    label="Ad və Soyad"
                    value={formData.fullName}
                    onChange={(value) => setFormData({ ...formData, fullName: value })}
                    icon={<UserIcon className="w-5 h-5" />}
                  />

                  <Input
                    label="Telefon nömrəsi"
                    value={formData.phone}
                    onChange={(value) => setFormData({ ...formData, phone: value })}
                    icon={<Phone className="w-5 h-5" />}
                  />

                  <Input
                    label="Email"
                    value={formData.email}
                    onChange={(value) => setFormData({ ...formData, email: value })}
                    icon={<Mail className="w-5 h-5" />}
                  />

                  <Button
                    onClick={() => void handleSave()}
                    loading={saving}
                    icon={<Save className="w-5 h-5" />}
                    className="w-full"
                  >
                    Yadda saxla
                  </Button>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <Card className="p-6 text-center">
                <div className="w-20 h-20 bg-[#D90429]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-10 h-10 text-[#D90429]" />
                </div>
                <p className="text-3xl font-bold text-[#1F2937]">{level}</p>
                <p className="text-[#6B7280]">Səviyyə (təxmini)</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Package className="w-5 h-5 text-[#D90429]" />
                  <span className="text-[#6B7280]">Ümumi sifariş</span>
                </div>
                <p className="text-2xl font-bold text-[#1F2937]">{orderCount}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-5 h-5 text-[#D90429]" />
                  <span className="text-[#6B7280]">Ümumi məbləğ (sifarişlər)</span>
                </div>
                <p className="text-2xl font-bold text-[#1F2937]">{totalSpent.toFixed(0)} AZN</p>
              </Card>

              <Card className="p-6">
                <p className="text-sm text-[#6B7280] mb-1">İstifadəçi ID</p>
                <p className="text-xs text-[#9CA3AF] font-mono break-all">{String(session.userId)}</p>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
