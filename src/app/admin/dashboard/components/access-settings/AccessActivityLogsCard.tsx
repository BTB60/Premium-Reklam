"use client";

import { CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { ActivityLog } from "./types";

export function AccessActivityLogsCard({ logs }: { logs: ActivityLog[] }) {
  return (
    <Card className="p-6">
      <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
        <CheckCircle className="w-5 h-5" />
        Fəaliyyət Loqları
      </h3>
      {logs.length === 0 ? (
        <p className="text-[#6B7280] text-center py-8">Loq yoxdur</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div
              key={log.id}
              className="text-sm p-3 bg-gray-50 rounded flex items-center justify-between"
            >
              <div>
                <span className="font-medium text-[#1F2937]">{log.subadminLogin}</span>
                <span className="text-[#6B7280] ml-2">{log.action}</span>
                <span className="text-[#6B7280] ml-2">[{log.feature}]</span>
                {log.details && <span className="text-[#9CA3AF] ml-2">({log.details})</span>}
              </div>
              <span className="text-[#9CA3AF] text-xs">
                {new Date(log.timestamp).toLocaleString("az-AZ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
