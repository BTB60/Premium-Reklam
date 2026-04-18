"use client";

import { Shield, Edit, Trash2, FileSpreadsheet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FEATURES } from "./constants";
import type { Subadmin } from "./types";

export function AccessSubadminsTableCard({
  subadmins,
  exportLoading,
  onExport,
  onEdit,
  onDelete,
}: {
  subadmins: Subadmin[];
  exportLoading: boolean;
  onExport: () => void;
  onEdit: (s: Subadmin) => void;
  onDelete: (id: string, login: string) => void;
}) {
  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-[#1F2937] flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Subadmin Siyahısı
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          loading={exportLoading}
          icon={<FileSpreadsheet className="w-4 h-4" />}
        >
          Excel-ə Export
        </Button>
      </div>

      {subadmins.length === 0 ? (
        <p className="text-[#6B7280] text-center py-8">Subadmin yoxdur. Yeni subadmin əlavə edin.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Login</th>
                <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Yaradılıb</th>
                <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Son Giriş</th>
                <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">İcazələr</th>
                <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {subadmins.map((s) => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{s.login}</td>
                  <td className="py-3 px-4 text-[#6B7280]">
                    {new Date(s.createdAt).toLocaleDateString("az-AZ")}
                  </td>
                  <td className="py-3 px-4 text-[#6B7280]">
                    {s.lastLogin ? new Date(s.lastLogin).toLocaleDateString("az-AZ") : "-"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {FEATURES.filter((f) => s.permissions[f.key] !== "none").map((f) => (
                        <span
                          key={f.key}
                          className={`px-2 py-1 rounded text-xs ${
                            s.permissions[f.key] === "edit"
                              ? "bg-[#D90429]/10 text-[#D90429]"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {f.label} {s.permissions[f.key] === "edit" ? "\u270F\uFE0F" : "\uD83D\uDC41\uFE0F"}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(s)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                        title="Redaktə"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(s.id, s.login)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
