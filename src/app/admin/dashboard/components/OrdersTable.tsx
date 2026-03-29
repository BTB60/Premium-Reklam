"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Search, Trash2 } from "lucide-react";
import { orderApi } from "@/lib/authApi";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function OrdersTable() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await orderApi.getOrdersFromBackend();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("[OrdersTable] Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1F2937]">Sifarişlər</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Axtar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
            />
          </div>
          <p className="text-[#6B7280]">Ümumi: {orders.length}</p>
        </div>
      </div>

      {loading ? (
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D90429] mx-auto" />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Sifariş ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Məbləğ</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Tarix</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">#{order.orderNumber || order.id}</td>
                  <td className="py-3 px-4 font-bold text-[#1F2937]">{order.totalAmount?.toFixed(2)} AZN</td>
                  <td className="py-3 px-4 text-sm text-[#6B7280]">
                    {new Date(order.createdAt).toLocaleDateString("az-AZ")}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="py-3 px-4">
                    <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Sil">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}