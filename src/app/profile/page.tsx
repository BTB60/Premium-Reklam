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
  Building2, 
  Mail, 
  Award, 
  TrendingUp, 
  Package,
  ArrowLeft,
  Save
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// ✅ ИСПРАВЛЕНО: убран несуществующий 'db', оставлен 'auth'
import { auth, type User } from "@/lib/db";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    setFormData({
      fullName: currentUser.fullName,
      phone: currentUser.phone || "",
      email: currentUser.email || "",
    });
    setLoading(false);
  }, [router]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    // ✅ ИСПРАВЛЕНО: db.updateUser → auth.updateUser
    const updatedUser: User = {
      ...user,
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email || undefined,
    };
    
    // Обновляем пользователя через auth модуль
    auth.updateUser(updatedUser);
    
    setUser(updatedUser);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D90429]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Header />
      
      <main className="pt-20 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
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

          <div className="grid md:grid-cols-3 gap-6">
            {/* Profile Info */}
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
                    onClick={handleSave}
                    loading={saving}
                    icon={<Save className="w-5 h-5" />}
                    className="w-full"
                  >
                    Yadda saxla
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Stats Sidebar */}
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
                <p className="text-3xl font-bold text-[#1F2937]">{user.level}</p>
                <p className="text-[#6B7280]">Səviyyə</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Package className="w-5 h-5 text-[#D90429]" />
                  <span className="text-[#6B7280]">Ümumi sifariş</span>
                </div>
                <p className="text-2xl font-bold text-[#1F2937]">{user.totalOrders}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-5 h-5 text-[#D90429]" />
                  <span className="text-[#6B7280]">Ümumi satış</span>
                </div>
                <p className="text-2xl font-bold text-[#1F2937]">{user.totalSales.toFixed(0)} AZN</p>
              </Card>

              <Card className="p-6">
                <p className="text-sm text-[#6B7280] mb-1">İstifadəçi ID</p>
                <p className="text-xs text-[#9CA3AF] font-mono break-all">{user.id}</p>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}