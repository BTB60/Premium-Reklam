"use client";

import { Eye, Pencil } from "lucide-react";
import type { PermissionLevel } from "./types";

export function PermissionToggle({
  value,
  onChange,
}: {
  value: PermissionLevel;
  onChange: (v: PermissionLevel) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={value === "view" || value === "edit"}
          onChange={(e) => onChange(e.target.checked ? "view" : "none")}
          className="rounded border-gray-300"
        />
        <span className="text-[#6B7280] flex items-center gap-1">
          <Eye className="w-3 h-3" /> Baxış
        </span>
      </label>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={value === "edit"}
          onChange={(e) => onChange(e.target.checked ? "edit" : value === "view" ? "view" : "none")}
          className="rounded border-gray-300"
        />
        <span className="text-[#6B7280] flex items-center gap-1">
          <Pencil className="w-3 h-3" /> Redaktə
        </span>
      </label>
    </div>
  );
}
