// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { orderApi, type OrderSummary } from "@/lib/authApi";
import { auth } from "@/lib/db/auth";
import { getFromStorage } from "@/lib/db/storage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { motion } from "framer-motion";
import { 
  Package, TrendingUp, CheckCircle, AlertCircle, Plus, Wallet, TrendingDown, ArrowRight 
} from "lucide-react";

export default function DashboardHomePage() {
  const router = useRouter();
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [bonusStats, setBonusStats] = useState({
    available: 0,
    spent: 0
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersResponse] = await Promise.all([orderApi.getMyOrders()]);
      const ordersData = ordersResponse as any;
      const orders = ordersData.orders || [];
      setUserOrders(orders);
      
      const today = new Date().toISOString().split('T')[0];
      const monthStart = today.substring(0, 7) + '-01';
      
      const todayOrders = orders.filter((o: any) => (o.createdAt || '').split('T')[0] === today);
      const monthOrders = orders.filter((o: any) => o.createdAt >= monthStart);
      const activeOrders = orders.filter((o: any) => o.paymentStatus !== 'CANCELLED');
      
      setOrderSummary({
        todayOrderCount: todayOrders.length,
        todayOrderAmount: todayOrders.reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0),
        monthOrderCount: monthOrders.length,
        monthOrderAmount: monthOrders.reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0),
        totalPaid: activeOrders.reduce((s: number, o: any) => s + Number(o.paidAmount || 0), 0),
        totalDebt: activeOrders.reduce((s: number, o: any) => s + Number(o.remainingAmount || 0), 0),
        totalOrders: orders.length,
        totalAmount: activeOrders.reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0),
      });

      // Чтение бонусов с резервным источником
      const sessionUser = auth.getCurrentUser();
      let finalBonusPoints = sessionUser?.bonusPoints || 0;
      let finalBonusSpent = sessionUser?.bonusSpent || 0;

      if (sessionUser && finalBonusPoints === 0) {
        const allUsers = getFromStorage<any[]>("decor_users", []);
        const dbUser = allUsers.find(u => u.id === sessionUser.id);
        if (dbUser && dbUser.bonusPoints > 0) {
          finalBonusPoints = dbUser.bonusPoints;
          finalBonusSpent = dbUser.bonusSpent || 0;
        }
      }

      setBonusStats({
        available: finalBonusPoints,
        spent: finalBonusSpent
      });
      
    } catch (error) {
      console.error("Data load error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // КРОСС-ТАБ СИНХРОНИЗАЦИЯ (без setInterval — убрана периодическая перезагрузка)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "decor_users" || e.key === "decor_orders" || e.key === "decor_current_user") {
        loadData();
      }
    };
    
    const handleCustomStorage = (e: Event) => {
      loadData();
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("storage:decor_users", handleCustomStorage as EventListener);
    window.addEventListener("storage:decor_orders", handleCustomStorage as EventListener);
    window.addEventListener("storage:decor_current_user", handleCustomStorage as EventListener);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("storage:decor_users", handleCustomStorage as EventListener);
      window.removeEventListener("storage:decor_orders", handleCustomStorage as EventListener);
      window.removeEventListener("storage:decor_current_user", handleCustomStorage as EventListener);
    };
  }, [loadData]);

  if (loading) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#D90429]/10 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-[#D90429]" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Ümumi Sifariş</p>
              <p className="text-2xl font-bold text-[#1F2937]">{userOrders.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#3B82F6]/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#3B82F6]" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Bu Ay Sifariş</p>
              <p className="text-2xl font-bold text-[#3B82F6]">{orderSummary?.monthOrderCount || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#16A34A]/10 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-[#16A34A]" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Ödənilib</p>
              <p className="text-2xl font-bold text-[#16A34A]">{(orderSummary?.totalPaid || 0).toFixed(2)} AZN</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#EF4444]/10 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-[#EF4444]" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Qalan Borc</p>
              <p className="text-2xl font-bold text-[#EF4444]">{(orderSummary?.totalDebt || 0).toFixed(2)} AZN</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Блок бонусов */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#1F2937] mb-3 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#D90429]" />
          Bonus Balansı
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 border-l-4 border-l-green-500 bg-white relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-5">
              <Wallet className="w-24 h-24 text-green-600" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-gray-500 mb-1">Mövcud bonus</p>
              <p className={`text-3xl font-bold mb-2 ${bonusStats.available >= 10 ? 'text-green-600' : 'text-gray-400'}`}>
                {bonusStats.available.toFixed(2)} <span className="text-lg text-gray-400">AZN</span>
              </p>
              
              {bonusStats.available >= 10 ? (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-full w-fit">
                  <CheckCircle className="w-4 h-4" />
                  <span>İstifadəyə hazırdır</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-orange-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min((bonusStats.available / 10) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-orange-600 font-medium">
                    Minimum 10 AZN yığılmalıdır ({(10 - bonusStats.available).toFixed(2)} AZN qalıb)
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5 border-l-4 border-l-blue-500 bg-white relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-5">
              <TrendingDown className="w-24 h-24 text-blue-600" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-gray-500 mb-1">Xərclənmiş bonus</p>
              <p className="text-3xl font-bold text-blue-700 mb-2">
                {bonusStats.spent.toFixed(2)} <span className="text-lg text-gray-400">AZN</span>
              </p>
              <p className="text-xs text-blue-600">
                Keçmiş sifarişlər üçün istifadə olunub
              </p>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <p className="text-xs text-blue-600 font-medium">Bu Gün Sifariş</p>
          <p className="text-3xl font-bold text-blue-700">{orderSummary?.todayOrderCount || 0}</p>
          <p className="text-xs text-blue-500 mt-1">{(orderSummary?.todayOrderAmount || 0).toFixed(2)} AZN</p>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
          <p className="text-xs text-purple-600 font-medium">Bu Ay Məbləğ</p>
          <p className="text-3xl font-bold text-purple-700">{(orderSummary?.monthOrderAmount || 0).toFixed(2)} AZN</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <p className="text-xs text-green-600 font-medium">Ümumi Ödəniş</p>
          <p className="text-3xl font-bold text-green-700">{(orderSummary?.totalPaid || 0).toFixed(2)} AZN</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
          <p className="text-xs text-red-600 font-medium">Ümumi Borc</p>
          <p className="text-3xl font-bold text-red-700">{(orderSummary?.totalDebt || 0).toFixed(2)} AZN</p>
        </Card>
      </div>

      <Card className="p-6 mb-6 bg-gradient-to-r from-[#D90429] to-[#EF476F] text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1">Yeni Sifariş Ver</h3>
            <p className="opacity-90 text-sm">Bonusla ödəmək imkanı var</p>
          </div>
          <Button 
            onClick={() => router.push("/dashboard/orders/new")}
            className="bg-white text-[#D90429] hover:bg-gray-100"
            icon={<Plus className="w-4 h-4" />}
          >
            Sifariş Et
          </Button>
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#1F2937]">Son Sifarişlər</h2>
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/orders")}>
            Hamısına Bax <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        {userOrders.length === 0 ? (
          <Card className="p-10 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-[#6B7280] mb-4">Hələ sifarişiniz yoxdur</p>
            <Button onClick={() => router.push("/dashboard/orders/new")} icon={<Plus className="w-4 h-4" />}>
              Sifariş Et
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3">
            {userOrders.slice(0, 5).map((order) => (
              <Card 
                key={order.id} 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" 
                onClick={() => router.push(`/dashboard/orders/${order.id}`)}
              >
                <div>
                  <p className="font-semibold text-[#1F2937]">#{order.orderNumber || order.id.slice(-6)}</p>
                  <p className="text-xs text-[#6B7280]">
                    {new Date(order.createdAt).toLocaleDateString("az-AZ")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-[#1F2937]">{(order.totalAmount || 0).toFixed(2)} AZN</p>
                    <p className="text-xs text-[#6B7280]">{order.items?.length || 0} məhsul</p>
                  </div>
                  <StatusBadge 
                    status={order.status?.toLowerCase() || "pending"} 
                    paymentStatus={order.paymentStatus}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}