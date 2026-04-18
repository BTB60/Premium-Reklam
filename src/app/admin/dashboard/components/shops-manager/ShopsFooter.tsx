"use client";

import { Card } from "@/components/ui/Card";

export function ShopsFooter({
  filteredCount,
  stats,
}: {
  filteredCount: number;
  stats: { active: number; pending: number };
}) {
  return (
    <Card className="mt-4 p-4 bg-[#1F2937] text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-white/60 text-xs">Göstərilən</p>
            <p className="font-bold">{filteredCount} ədəd</p>
          </div>
          <div>
            <p className="text-white/60 text-xs">Aktiv</p>
            <p className="font-bold text-green-400">{stats.active} ədəd</p>
          </div>
          <div>
            <p className="text-white/60 text-xs">Gözləyir</p>
            <p className="font-bold text-amber-400">{stats.pending} ədəd</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
