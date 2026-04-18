"use client";

import { Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PRODUCT_CATEGORIES } from "./constants";

export function ProductsFilterBar({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
  resultCount,
}: {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  resultCount: number;
}) {
  return (
    <Card className="p-4 mb-6">
      <div className="grid md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Axtar..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
        >
          <option value="all">Bütün kateqoriyalar</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
        >
          <option value="all">Bütün statuslar</option>
          <option value="active">Aktiv</option>
          <option value="inactive">Qeyri-aktiv</option>
          <option value="draft">Qaralama</option>
        </select>
        <div className="text-right text-sm text-[#6B7280] flex items-center justify-end">
          Nəticə: {resultCount}
        </div>
      </div>
    </Card>
  );
}
