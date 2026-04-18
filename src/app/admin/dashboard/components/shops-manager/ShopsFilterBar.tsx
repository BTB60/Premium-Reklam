"use client";

import { Search } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function ShopsFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
}) {
  return (
    <Card className="p-4 mb-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Axtar: mağaza adı, istifadəçi, ünvan..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
        >
          <option value="all">Bütün statuslar</option>
          <option value="active">Aktiv</option>
          <option value="pending">Gözləyir</option>
          <option value="inactive">Qeyri-aktiv</option>
        </select>
      </div>
    </Card>
  );
}
