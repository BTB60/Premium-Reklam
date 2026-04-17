// src/app/admin/dashboard/components/StatsCards.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Users, Package, TrendingUp, Award } from "lucide-react";

export default function StatsCards() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    decorators: 0,
    admins: 0,
  });

  // ✅ Функция загрузки данных напрямую из LocalStorage (гарантированно работает)
  const loadStats = () => {
    try {
      // Безопасное чтение в браузере
      const usersRaw = typeof window !== 'undefined' ? localStorage.getItem('decor_users') : '[]';
      const ordersRaw = typeof window !== 'undefined' ? localStorage.getItem('decor_orders') : '[]';
      
      const allUsers = JSON.parse(usersRaw || '[]');
      const allOrders = JSON.parse(ordersRaw || '[]');

      console.log("[StatsCards] Loaded Users:", allUsers.length, "Orders:", allOrders.length);

      // Расчеты
      const decorators = allUsers.filter((u: any) => u.role === "DECORATOR").length;
      const admins = allUsers.filter((u: any) => u.role === "ADMIN").length;

      const totalOrders = allOrders.length;
      // Статус pending = "təsdiq"
      const pendingOrders = allOrders.filter((o: any) => o.workflowStatus === "təsdiq").length;
      
      // Доход: только оплаченные (paid) или завершенные (bitdi)
      const totalRevenue = allOrders
        .filter((o: any) => o.paymentStatus === "paid" || o.workflowStatus === "bitdi")
        .reduce((sum: number, o: any) => sum + (Number(o.finalTotal) || 0), 0);

      setStats({
        totalUsers: allUsers.length,
        totalOrders,
        pendingOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        decorators,
        admins,
      });
    } catch (e) {
      console.error("[StatsCards] Error parsing data:", e);
    }
  };

  // Загрузка при старте
  useEffect(() => {
    loadStats();
  }, []);

  // ✅ Слушаем изменения в других вкладках или модулях
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "decor_users" || e.key === "decor_orders") {
        loadStats();
      }
    };
    
    // Для кросс-таб синхронизации
    window.addEventListener("storage", handler);
    
    // Для синхронизации внутри одной вкладки (кастомные события из db/storage)
    window.addEventListener("storage:decor_users", loadStats);
    window.addEventListener("storage:decor_orders", loadStats);

    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("storage:decor_users", loadStats);
      window.removeEventListener("storage:decor_orders", loadStats);
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1F2937] mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#6B7280] text-sm">Ümumi İstifadəçi</p>
              <p className="text-3xl font-bold text-[#1F2937]">{stats.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-[#D90429]/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-[#D90429]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#6B7280] text-sm">Ümumi Sifariş</p>
              <p className="text-3xl font-bold text-[#1F2937]">{stats.totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#6B7280] text-sm">Gözləyən Sifariş</p>
              <p className="text-3xl font-bold text-[#1F2937]">{stats.pendingOrders}</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#6B7280] text-sm">Ümumi Gəlir</p>
              <p className="text-3xl font-bold text-[#1F2937]">{stats.totalRevenue.toFixed(2)} AZN</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-[#1F2937] mb-4">İstifadəçi Rolleri</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Decorator</span>
              <span className="font-semibold">{stats.decorators}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Admin</span>
              <span className="font-semibold">{stats.admins}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-[#1F2937] mb-4">Son Sifarişlər</h3>
          <p className="text-[#6B7280] text-sm">
            {stats.totalOrders > 0 
              ? `Cəmi: ${stats.totalOrders} sifariş qeydə alınıb` 
              : "Hələ sifariş yoxdur"}
          </p>
        </Card>
      </div>
    </div>
  );
}