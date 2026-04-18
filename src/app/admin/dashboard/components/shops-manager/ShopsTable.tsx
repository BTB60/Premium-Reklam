"use client";

import {
  Store,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { DashboardShop } from "./types";

export function ShopsTable({
  shops,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  shops: DashboardShop[];
  onEdit: (s: DashboardShop) => void;
  onDelete: (id: number) => void;
  onStatusChange: (shopId: number, status: string) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Mağaza</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">İstifadəçi</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Əlaqə</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Ünvan</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Tarix</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Əməliyyat</th>
          </tr>
        </thead>
        <tbody>
          {shops.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-[#6B7280]">
                Mağaza tapılmadı
              </td>
            </tr>
          ) : (
            shops.map((shop) => (
              <tr key={shop.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#D90429]/10 rounded-full flex items-center justify-center">
                      <Store className="w-5 h-5 text-[#D90429]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1F2937]">{shop.name}</p>
                      {shop.description && (
                        <p className="text-xs text-[#6B7280] line-clamp-1">{shop.description}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-sm">{shop.userFullName}</p>
                    <p className="text-xs text-[#6B7280]">@{shop.userUsername}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="space-y-1">
                    {shop.phone && (
                      <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                        <Phone className="w-3 h-3" />
                        {shop.phone}
                      </div>
                    )}
                    {shop.email && (
                      <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                        <Mail className="w-3 h-3" />
                        {shop.email}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  {shop.address ? (
                    <div className="flex items-center gap-1 text-sm text-[#6B7280]">
                      <MapPin className="w-4 h-4" />
                      {shop.address}
                    </div>
                  ) : (
                    <span className="text-sm text-[#6B7280]">-</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <select
                    value={shop.status}
                    onChange={(e) => onStatusChange(shop.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded border ${
                      shop.status === "active"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : shop.status === "pending"
                          ? "bg-amber-100 text-amber-700 border-amber-200"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                  >
                    <option value="active">Aktiv</option>
                    <option value="pending">Gözləyir</option>
                    <option value="inactive">Qeyri-aktiv</option>
                  </select>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1 text-sm text-[#6B7280]">
                    <Calendar className="w-4 h-4" />
                    {new Date(shop.createdAt).toLocaleDateString("az-AZ")}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(shop)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                      title="Redaktə"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(shop.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Card>
  );
}
