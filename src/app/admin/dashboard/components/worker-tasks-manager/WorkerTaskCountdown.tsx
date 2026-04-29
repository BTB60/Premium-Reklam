"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

function formatRemaining(ms: number): { line: string; overdue: boolean } {
  if (ms <= 0) {
    const behind = Math.abs(ms);
    const s = Math.floor(behind / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return {
      line: `Gecikmə: ${h}sa ${m}dəq ${sec}san`,
      overdue: true,
    };
  }
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return {
    line: `${h} sa ${m} dəq ${sec} san qalıb`,
    overdue: false,
  };
}

export function WorkerTaskCountdown({ deadlineIso }: { deadlineIso: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const end = new Date(deadlineIso).getTime();
  const { line, overdue } = formatRemaining(end - now);

  return (
    <div
      className={`mt-1 flex items-center gap-1.5 text-xs font-semibold tabular-nums ${
        overdue ? "text-red-600" : "text-blue-700"
      }`}
    >
      <Timer className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
      <span>{line}</span>
    </div>
  );
}
