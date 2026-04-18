"use client";

import { Card } from "@/components/ui/Card";

export function SupportListFooter({
  filteredCount,
  stats,
}: {
  filteredCount: number;
  stats: { open: number; resolved: number; urgent: number };
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
            <p className="text-white/60 text-xs">Açıq</p>
            <p className="font-bold text-blue-400">{stats.open} ədəd</p>
          </div>
          <div>
            <p className="text-white/60 text-xs">Həll olunub</p>
            <p className="font-bold text-green-400">{stats.resolved} ədəd</p>
          </div>
          {stats.urgent > 0 && (
            <div>
              <p className="text-white/60 text-xs">Təcili</p>
              <p className="font-bold text-red-400">{stats.urgent} ədəd</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
