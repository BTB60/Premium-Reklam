"use client";

import { Card } from "@/components/ui/Card";

export function WorkerTasksFooter({
  filteredCount,
  stats,
}: {
  filteredCount: number;
  stats: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
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
            <p className="text-white/60 text-xs">Tamamlanma</p>
            <p className="font-bold text-green-400">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
            </p>
          </div>
          <div>
            <p className="text-white/60 text-xs">Gözləyir</p>
            <p className="font-bold text-amber-400">{stats.pending} ədəd</p>
          </div>
          {stats.overdue > 0 && (
            <div>
              <p className="text-white/60 text-xs">Gecikib</p>
              <p className="font-bold text-red-400">{stats.overdue} ədəd</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
