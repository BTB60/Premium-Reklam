"use client";

import { CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function ShopsStatsCards({
  stats,
}: {
  stats: { total: number; active: number; pending: number; inactive: number };
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="p-4">
        <p className="text-[#6B7280] text-sm">Ümumi</p>
        <p className="text-2xl font-bold text-[#1F2937]">{stats.total}</p>
      </Card>
      <Card className="p-4 bg-green-50">
        <p className="text-green-600 text-sm flex items-center gap-1">
          <CheckCircle className="w-4 h-4" /> Aktiv
        </p>
        <p className="text-2xl font-bold text-green-700">{stats.active}</p>
      </Card>
      <Card className="p-4 bg-amber-50">
        <p className="text-amber-600 text-sm">Gözləyir</p>
        <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
      </Card>
      <Card className="p-4 bg-gray-50">
        <p className="text-gray-600 text-sm">Qeyri-aktiv</p>
        <p className="text-2xl font-bold text-gray-700">{stats.inactive}</p>
      </Card>
    </div>
  );
}
