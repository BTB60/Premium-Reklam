"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface FilterBarProps {
  searchPlaceholder?: string;
  filters?: FilterOption[];
  onSearch?: (query: string) => void;
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
  className?: string;
}

export function FilterBar({
  searchPlaceholder = "Axtar...",
  filters = [],
  onSearch,
  onFilterChange,
  onClearFilters,
  className,
}: FilterBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...activeFilters, [key]: value };
    if (!value) {
      delete newFilters[key];
    }
    setActiveFilters(newFilters);
    onFilterChange?.(key, value);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setActiveFilters({});
    onClearFilters?.();
  };

  const hasActiveFilters = searchQuery || Object.keys(activeFilters).length > 0;

  return (
    <div className={cn("bg-white rounded-xl border border-[#E5E7EB] p-4", className)}>
      {/* Search and Filter Toggle */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(value) => handleSearch(value)}
            className="pl-10"
          />
        </div>
        {filters.length > 0 && (
          <Button
            variant={showFilters ? "primary" : "ghost"}
            onClick={() => setShowFilters(!showFilters)}
            icon={<SlidersHorizontal className="h-4 w-4" />}
          >
            Filter
            {Object.keys(activeFilters).length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-[#D90429] text-white text-xs rounded-full">
                {Object.keys(activeFilters).length}
              </span>
            )}
          </Button>
        )}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={handleClearFilters} icon={<X className="h-4 w-4" />}>
            Təmizlə
          </Button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && filters.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filters.map((filter) => (
            <div key={filter.key}>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                {filter.label}
              </label>
              <select
                value={activeFilters[filter.key] || ""}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D90429]/20 focus:border-[#D90429] transition-all"
              >
                <option value="">Hamısı</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Active Filter Tags */}
      {Object.keys(activeFilters).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([key, value]) => {
            const filter = filters.find((f) => f.key === key);
            const option = filter?.options.find((o) => o.value === value);
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F8F9FB] text-[#374151] text-sm rounded-full border border-[#E5E7EB]"
              >
                {filter?.label}: {option?.label || value}
                <button
                  onClick={() => handleFilterChange(key, "")}
                  className="hover:text-[#D90429] transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
