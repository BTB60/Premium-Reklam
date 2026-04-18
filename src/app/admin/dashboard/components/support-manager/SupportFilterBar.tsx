"use client";

import { Search } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function SupportFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  categoryFilter,
  onCategoryFilterChange,
}: {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (v: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (v: string) => void;
}) {
  return (
    <Card className="p-4 mb-6">
      <div className="grid md:grid-cols-5 gap-4">
        <div className="relative md:col-span-2">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Axtar: mövzu, istifadəçi, mesaj..."
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
          <option value="open">Açıq</option>
          <option value="in_progress">İcra olunur</option>
          <option value="resolved">Həll olunub</option>
          <option value="closed">Bağlandı</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => onPriorityFilterChange(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
        >
          <option value="all">Bütün prioritetlər</option>
          <option value="low">Aşağı</option>
          <option value="medium">Orta</option>
          <option value="high">Yüksək</option>
          <option value="urgent">Təcili</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
        >
          <option value="all">Bütün kateqoriyalar</option>
          <option value="technical">Texniki</option>
          <option value="billing">Ödəniş</option>
          <option value="order">Sifariş</option>
          <option value="account">Hesab</option>
          <option value="other">Digər</option>
        </select>
      </div>
    </Card>
  );
}
