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
  Camera,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import authApi, { orderApi, type UserData } from "@/lib/authApi";

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    profileImage: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
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
      profileImage: current.profileImage || "",
    });

    void (async () => {
      try {
        const profile = await authApi.getMyProfile();
        setFormData({
          fullName: profile.fullName || "",
          phone: profile.phone || "",
          email: profile.email || "",
          profileImage: profile.profileImage || "",
        });
        const merged: UserData = {
          ...current,
          userId: profile.userId,
          fullName: profile.fullName,
          phone: profile.phone || undefined,
          email: profile.email || undefined,
          profileImage: profile.profileImage || undefined,
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
        profileImage: formData.profileImage,
      });
      const next: UserData = {
        ...session,
        userId: updated.userId,
        fullName: updated.fullName,
        phone: updated.phone || undefined,
        email: updated.email || undefined,
        profileImage: updated.profileImage || undefined,
        role: updated.role,
      };
      authApi.saveCurrentUser(next);
      setSession(next);
      setFormData({
        fullName: updated.fullName || "",
        phone: updated.phone || "",
        email: updated.email || "",
        profileImage: updated.profileImage || "",
      });
      alert("Profil məlumatları yeniləndi");
    } catch (error: any) {
      console.error("[Profile] Save error:", error);
      alert(error?.message || "Profil yenilənmədi");
    } finally {
      setSaving(false);
    }
  };

  const handleProfileImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Yalnız şəkil faylı seçin");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Profil şəkli 2 MB-dan böyük olmamalıdır");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, profileImage: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      alert("Cari və yeni şifrəni daxil edin");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert("Yeni şifrə ən az 6 simvol olmalıdır");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Yeni şifrələr uyğun gəlmir");
      return;
    }
    setPasswordSaving(true);
    try {
      await authApi.changeMyPassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      alert("Şifrə uğurla dəyişdirildi");
    } catch (error: any) {
      alert(error?.message || "Şifrə dəyişdirilmədi");
    } finally {
      setPasswordSaving(false);
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
            <div>
              <h1 className="text-2xl font-bold text-[#1F2937]">Tənzimləmələr</h1>
              <p className="text-sm text-[#6B7280] mt-1">
                Şəxsi məlumatlarınızı, profil şəklinizi və parolunuzu buradan dəyişə bilərsiniz.
              </p>
            </div>
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
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl bg-gray-50 p-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-[#D90429]/10 flex items-center justify-center border-4 border-white shadow-sm">
                      {formData.profileImage ? (
                        <img src={formData.profileImage} alt="Profil" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-10 h-10 text-[#D90429]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#1F2937]">Profil şəkli</p>
                      <p className="text-sm text-[#6B7280] mb-3">JPG/PNG, maksimum 2 MB.</p>
                      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-[#1F2937] hover:border-[#D90429] cursor-pointer">
                        <Camera className="w-4 h-4 text-[#D90429]" />
                        Şəkil seç
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleProfileImage(e.target.files?.[0])}
                        />
                      </label>
                      {formData.profileImage && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, profileImage: "" })}
                          className="ml-3 text-sm text-red-600 hover:underline"
                        >
                          Sil
                        </button>
                      )}
                    </div>
                  </div>

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

              <Card className="p-6 mt-6">
                <h2 className="text-lg font-semibold text-[#1F2937] mb-6 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#D90429]" />
                  Şifrəni dəyiş
                </h2>
                <div className="space-y-5">
                  <Input
                    label="Cari şifrə"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(value) => setPasswordForm({ ...passwordForm, currentPassword: value })}
                  />
                  <Input
                    label="Yeni şifrə"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(value) => setPasswordForm({ ...passwordForm, newPassword: value })}
                  />
                  <Input
                    label="Yeni şifrə (təkrar)"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(value) => setPasswordForm({ ...passwordForm, confirmPassword: value })}
                  />
                  <Button
                    onClick={() => void handleChangePassword()}
                    loading={passwordSaving}
                    icon={<Lock className="w-5 h-5" />}
                    className="w-full"
                    variant="secondary"
                  >
                    Şifrəni yenilə
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
                <div className="w-20 h-20 bg-[#D90429]/10 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                  {formData.profileImage ? (
                    <img src={formData.profileImage} alt="Profil" className="w-full h-full object-cover" />
                  ) : (
                    <Award className="w-10 h-10 text-[#D90429]" />
                  )}
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
