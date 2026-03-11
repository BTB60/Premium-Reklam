"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { auth, orders, notifications, vendorStores, playNotificationSound, type User, type Order, type Notification } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { 
  Plus, 
  Package, 
  TrendingUp, 
  Award,
  ShoppingBag,
  ArrowRight,
  CheckCircle,
  Calendar,
  Calendar as CalendarIcon,
  Phone,
  UserCircle,
  FileText,
  Headphones,
  Heart,
  Gift,
  Calculator as CalculatorIcon,
  Store,
  Settings
} from "lucide-react";
import Link from "next/link";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderSuccess = searchParams.get("orderSuccess") === "true";
  
  const [user, setUser] = useState<User | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [userNotifications, setUserNotifications] = useState<Notification[]>([]);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const [hasStore, setHasStore] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();

    if (!currentUser) {
      router.push("/login");
      return;
    }

    if (currentUser.role === "ADMIN") {
      router.push("/admin/dashboard");
      return;
    }

    setUser(currentUser);
    setUserOrders(orders.getByUserId(currentUser.id));
    
    // Check if user has a store
    const userStore = vendorStores.getByVendorId(currentUser.id);
    setHasStore(!!userStore);
    
    // Load notifications
    const notifs = notifications.getByUserId(currentUser.id);
    setUserNotifications(notifs);
    setLastNotificationCount(notifs.length);
    
    setLoading(false);
  }, [router]);

  // Check for new notifications every 5 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      const notifs = notifications.getByUserId(user.id);
      const unreadCount = notifs.filter(n => !n.isRead).length;
      
      // If there are new notifications, play sound
      if (notifs.length > lastNotificationCount) {
        playNotificationSound();
        setLastNotificationCount(notifs.length);
      }
      
      setUserNotifications(notifs);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [user, lastNotificationCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D90429]" />
      </div>
    );
  }

  if (!user) return null;

  const stats = {
    totalOrders: user.totalOrders,
    totalSpent: user.totalSales,
    pendingOrders: userOrders.filter(o => o.status === "pending").length,
    completedOrders: userOrders.filter(o => o.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Header />
      
      <main className="pt-20 pb-24 lg:pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Message */}
          {orderSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-700">Sifarişiniz uğurla qəbul edildi! Admin təsdiqindən sonra emal olunacaq.</p>
            </motion.div>
          )}

          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#1F2937]">Xoş gəldin, {user.fullName}</h1>
                <p className="text-[#6B7280] mt-1">Şəxsi kabinetinizdən sifarişlərinizi idarə edin</p>
              </div>
              <Link href="/orders/new">
                <Button icon={<Plus className="w-5 h-5" />} size="lg">
                  Yeni sifariş
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#D90429]/10 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-[#D90429]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1F2937]">{stats.totalOrders}</p>
                  <p className="text-xs text-[#6B7280]">Ümumi sifariş</p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1F2937]">{stats.totalSpent.toFixed(0)}</p>
                  <p className="text-xs text-[#6B7280]">Ümumi xərcləmə (AZN)</p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1F2937]">{stats.pendingOrders}</p>
                  <p className="text-xs text-[#6B7280]">Gözləyən</p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1F2937]">{user.level}</p>
                  <p className="text-xs text-[#6B7280]">Level</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Orders Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#D90429]" />
                    Sifarişlərim
                  </h2>
                  <Link href="/orders">
                    <Button variant="ghost" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                      Hamısını gör
                    </Button>
                  </Link>
                </div>

                {userOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-[#6B7280] mb-4">Hələ sifarişiniz yoxdur</p>
                    <Link href="/orders/new">
                      <Button icon={<Plus className="w-4 h-4" />}>
                        İlk sifarişi yarat
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userOrders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[#1F2937]">
                              #{order.id.slice(-6)}
                            </span>
                            <StatusBadge status={order.status} />
                          </div>
                          <p className="text-sm text-[#6B7280] mt-1">
                            {new Date(order.createdAt).toLocaleDateString("az-AZ")} • {order.items.length} məhsul
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#1F2937]">{order.finalTotal.toFixed(2)} AZN</p>
                          <p className="text-xs text-[#6B7280]">{order.paymentMethod === "cash" ? "Nəğd" : order.paymentMethod === "card" ? "Kart" : "Borc"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Profile Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {/* Profile Card */}
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-[#D90429]/10 rounded-full flex items-center justify-center">
                    <UserCircle className="w-8 h-8 text-[#D90429]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1F2937]">{user.fullName}</h3>
                    <p className="text-sm text-[#6B7280]">@{user.username}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-[#6B7280]" />
                    <span>{user.phone || "-"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-[#6B7280]" />
                    <span>Qeydiyyat: {new Date(user.createdAt).toLocaleDateString("az-AZ")}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Level {user.level}</span>
                    <span className="text-sm text-[#D90429] font-medium">
                      {user.level < 100 ? `${100 - user.level} level qalib` : "Maksimum"}
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#D90429] rounded-full transition-all"
                      style={{ width: `${Math.min((user.level / 100) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#6B7280] mt-2">
                    Level 100+ borc sisteminə çıxış əldə edir
                  </p>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="font-semibold text-[#1F2937] mb-4">Sürətli əməliyyatlar</h3>
                <div className="space-y-2">
                  <Link href="/orders/new">
                    <Button variant="ghost" className="w-full justify-start" icon={<Plus className="w-4 h-4" />}>
                      Yeni sifariş
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button variant="ghost" className="w-full justify-start" icon={<UserCircle className="w-4 h-4" />}>
                      Profilim
                    </Button>
                  </Link>
                  <Link href="/notifications">
                    <Button variant="ghost" className="w-full justify-start" icon={<Package className="w-4 h-4" />}>
                      Bildirişlər
                    </Button>
                  </Link>
                  <Link href="/dashboard/bonus">
                    <Button variant="ghost" className="w-full justify-start" icon={<Award className="w-4 h-4" />}>
                      Bonuslarım ({user.bonusPoints} xal)
                    </Button>
                  </Link>
                  <Link href="/dashboard/payments">
                    <Button variant="ghost" className="w-full justify-start" icon={<TrendingUp className="w-4 h-4" />}>
                      Ödənişlərim
                    </Button>
                  </Link>
                  <Link href="/dashboard/templates">
                    <Button variant="ghost" className="w-full justify-start" icon={<FileText className="w-4 h-4" />}>
                      Şablonlarım
                    </Button>
                  </Link>
                  <Link href="/dashboard/support">
                    <Button variant="ghost" className="w-full justify-start" icon={<Headphones className="w-4 h-4" />}>
                      Dəstək Mərkəzi
                    </Button>
                  </Link>
                  <Link href="/dashboard/vendor">
                    <Button variant="ghost" className="w-full justify-start" icon={<Store className="w-4 h-4" />}>
                      {hasStore ? "Mağazam" : "Mağaza Aç"}
                    </Button>
                  </Link>
                  <Link href="/dashboard/settings">
                    <Button variant="ghost" className="w-full justify-start" icon={<Settings className="w-4 h-4" />}>
                      Tənzimləmələr
                    </Button>
                  </Link>
                  <Link href="/dashboard/calendar">
                    <Button variant="ghost" className="w-full justify-start" icon={<CalendarIcon className="w-4 h-4" />}>
                      Təqvimim
                    </Button>
                  </Link>
                  <Link href="/dashboard/favorites">
                    <Button variant="ghost" className="w-full justify-start" icon={<Heart className="w-4 h-4" />}>
                      Favorilərim
                    </Button>
                  </Link>
                  <Link href="/dashboard/referral">
                    <Button variant="ghost" className="w-full justify-start" icon={<Gift className="w-4 h-4" />}>
                      Referral Proqramı
                    </Button>
                  </Link>
                  <Link href="/dashboard/calculator">
                    <Button variant="ghost" className="w-full justify-start" icon={<CalculatorIcon className="w-4 h-4" />}>
                      Qiymət Hesablayıcı
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yüklənir...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
