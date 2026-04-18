"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getLocalAdminAuditLogs, type AdminAuditEntry } from "@/lib/auditLog";

export default function AuditLogsPanel() {
  const [logs, setLogs] = useState<AdminAuditEntry[]>([]);

  const refreshLogs = () => {
    setLogs(getLocalAdminAuditLogs());
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1F2937]">Audit Logs</h1>
        <Button variant="secondary" onClick={refreshLogs}>
          Yenilə
        </Button>
      </div>

      <Card className="overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-[#6B7280]">Hələ audit log yoxdur.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Vaxt</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">İstifadəçi</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Action</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Payload</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-gray-100">
                  <td className="py-3 px-4 text-sm text-[#6B7280]">
                    {new Date(log.createdAt).toLocaleString("az-AZ")}
                  </td>
                  <td className="py-3 px-4 font-medium">{log.actor}</td>
                  <td className="py-3 px-4">{log.action}</td>
                  <td className="py-3 px-4 text-xs text-[#6B7280]">
                    {log.payload ? JSON.stringify(log.payload) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
