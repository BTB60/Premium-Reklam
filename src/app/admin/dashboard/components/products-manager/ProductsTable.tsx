"use client";

import { Edit, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { DashboardProduct } from "./types";

export function ProductsTable({
  products,
  onEdit,
  onDelete,
}: {
  products: DashboardProduct[];
  onEdit: (p: DashboardProduct) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Məhsul</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Kateqoriya</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Ölçü</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Qiymət</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Əməliyyat</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-[#6B7280]">
                Məhsul tapılmadı
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={String(product.id)} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {product.imageUrl && (
                      <img src={product.imageUrl} alt="" className="w-10 h-10 object-cover rounded" />
                    )}
                    <div>
                      <p className="font-medium text-[#1F2937]">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-[#6B7280] line-clamp-1">{product.description}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                    {product.category || "-"}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-[#6B7280]">
                  {product.width && product.height ? `${product.width} × ${product.height} m²` : "-"}
                </td>
                <td className="py-3 px-4 font-bold text-[#1F2937]">
                  {(product.unitPrice || 0).toFixed(2)} AZN
                </td>
                <td className="py-3 px-4">
                  <StatusBadge status={product.status} />
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                      title="Redaktə"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(Number(product.id))}
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
