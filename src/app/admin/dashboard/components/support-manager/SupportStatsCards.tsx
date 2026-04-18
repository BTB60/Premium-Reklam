"use client";

import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function SupportStatsCards({
  stats,
}: {
  stats: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    urgent: number;
  };
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <Card className="p-4">
        <p className="text-[#6B7280] text-sm">Ümumi</p>
        <p className="text-2xl font-bold text-[#1F2937]">{stats.total}</p>
      </Card>
      <Card className="p-4 bg-blue-50">
        <p className="text-blue-600 text-sm flex items-center gap-1">
          <Clock className="w-4 h-4" /> Açıq
        </p>
        <p className="text-2xl font-bold text-blue-700">{stats.open}</p>
      </Card>
      <Card className="p-4 bg-amber-50">
        <p className="text-amber-600 text-sm">İcra olunur</p>
        <p className="text-2xl font-bold text-amber-700">{stats.inProgress}</p>
      </Card>
      <Card className="p-4 bg-green-50">
        <p className="text-green-600 text-sm flex items-center gap-1">
          <CheckCircle className="w-4 h-4" /> Həll olunub
        </p>
        <p className="text-2xl font-bold text-green-700">{stats.resolved}</p>
      </Card>
      <Card className="p-4 bg-red-50">
        <p className="text-red-600 text-sm flex items-center gap-1">
          <AlertCircle className="w-4 h-4" /> Təcili
        </p>
        <p className="text-2xl font-bold text-red-700">{stats.urgent}</p>
      </Card>
    </div>
  );
}
