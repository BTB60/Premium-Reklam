"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { X, Download, Filter, User, Clock, MapPin, Copy } from "lucide-react";

interface UserLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  ipAddress?: string;
  referralCode?: string;
  referrer?: string;
}

interface UserLogsProps {
  onClose?: () => void;
}

export function UserLogs({ onClose }: UserLogsProps) {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "login" | "order" | "register">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Load logs from localStorage (in real app, this would come from backend)
    const storedLogs = localStorage.getItem("decor_user_logs");
    if (storedLogs) {
      setLogs(JSON.parse(storedLogs));
    } else {
      // Demo logs for testing
      const demoLogs: UserLog[] = [
        {
          id: "1",
          userId: "1",
          userName: "Əli Vəliyev",
          action: "Giriş",
          timestamp: new Date().toISOString(),
          ipAddress: "192.168.1.1",
          referralCode: "REF123",
        },
        {
          id: "2",
          userId: "2",
          userName: "Nigar Hüseynova",
          action: "Sifariş",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          ipAddress: "192.168.1.2",
          referralCode: "REF456",
          referrer: "Instagram",
        },
        {
          id: "3",
          userId: "3",
          userName: "Kamran Məmmədov",
          action: "Qeydiyyat",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          ipAddress: "192.168.1.3",
          referralCode: "REF789",
          referrer: "Facebook",
        },
      ];
      setLogs(demoLogs);
      localStorage.setItem("decor_user_logs", JSON.stringify(demoLogs));
    }
    setLoading(false);
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filter !== "all" && !log.action.toLowerCase().includes(filter)) {
      return false;
    }
    if (searchTerm && !log.userName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const exportLogs = () => {
    const csv = [
      ["ID", "İstifadəçi", "Əməliyyat", "Vaxt", "IP", "Referal Kodu", "Mənbə"].join(","),
      ...filteredLogs.map((log) =>
        [log.id, log.userName, log.action, log.timestamp, log.ipAddress || "", log.referralCode || "", log.referrer || ""].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `user_logs_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const copyReferralCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Referal kodu kopyalandı!");
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-[#1F2937]">İstifadəçi Logları</h2>
            <p className="text-sm text-[#6B7280]">
              İstifadəçi fəaliyyətləri və referal məlumatları
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={exportLogs}>
              Export CSV
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" icon={<X className="w-5 h-5" />} onClick={onClose}>
                Bağla
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">Hamısı</option>
              <option value="login">Giriş</option>
              <option value="order">Sifariş</option>
              <option value="register">Qeydiyyat</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="İstifadəçi axtar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Yüklənir...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Log tapılmadı</div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="pb-3 font-medium">İstifadəçi</th>
                  <th className="pb-3 font-medium">Əməliyyat</th>
                  <th className="pb-3 font-medium">Vaxt</th>
                  <th className="pb-3 font-medium">IP</th>
                  <th className="pb-3 font-medium">Referal Kodu</th>
                  <th className="pb-3 font-medium">Mənbə</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{log.userName}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          log.action === "Giriş"
                            ? "bg-blue-100 text-blue-700"
                            : log.action === "Sifariş"
                            ? "bg-green-100 text-green-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleString("az-AZ")}
                      </div>
                    </td>
                    <td className="py-3 text-sm text-gray-500">{log.ipAddress || "-"}</td>
                    <td className="py-3">
                      {log.referralCode ? (
                        <button
                          onClick={() => copyReferralCode(log.referralCode!)}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          <Copy className="w-3 h-3" />
                          <span className="text-sm font-mono">{log.referralCode}</span>
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3">
                      {log.referrer ? (
                        <span className="text-sm">{log.referrer}</span>
                      ) : (
                        <span className="text-gray-400 text-sm">Birbaşa</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Stats */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Cəmi: {filteredLogs.length} log</span>
            <span className="text-gray-500">
              Referal ilə gələn: {logs.filter((l) => l.referralCode).length}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
