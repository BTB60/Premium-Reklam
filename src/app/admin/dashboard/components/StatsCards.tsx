"use client";

import { Card } from "@/components/ui/Card";
import { Users, Package, TrendingUp, Award } from "lucide-react";

export default function StatsCards() {
  // Заглушки — потом подключим к API
  const stats = {
    totalUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    decorators: 0,
    admins: 0,
  };

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
              <p className="text-3xl font-bold text-[#1F2937]">{stats.totalRevenue.toFixed(0)} AZN</p>
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
          <p className="text-[#6B7280] text-sm">Tezliklə əlavə olunacaq...</p>
        </Card>
      </div>
    </div>
  );
}