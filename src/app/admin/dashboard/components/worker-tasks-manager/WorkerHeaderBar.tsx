"use client";

import { ClipboardList, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function WorkerHeaderBar({
  onExport,
  onNewTask,
}: {
  onExport: () => void;
  onNewTask: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="w-8 h-8 text-[#D90429]" />
        <h1 className="text-2xl font-bold text-[#1F2937]">Tapşırıqlar</h1>
      </div>
      <div className="flex gap-2">
        <Button onClick={onExport} variant="ghost" size="sm" icon={<Download className="w-4 h-4" />}>
          Export
        </Button>
        <Button onClick={onNewTask} icon={<Plus className="w-4 h-4" />}>
          Yeni tapşırıq
        </Button>
      </div>
    </div>
  );
}
