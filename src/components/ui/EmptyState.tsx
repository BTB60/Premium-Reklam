"use client";

import { Package, Search, FileX, Inbox, FolderOpen } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  type?: "default" | "search" | "orders" | "files" | "notifications";
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const emptyStateConfig = {
  default: {
    icon: Package,
    title: "Məlumat tapılmadı",
    description: "Hələ heç bir məlumat yoxdur.",
  },
  search: {
    icon: Search,
    title: "Axtarış nəticəsi tapılmadı",
    description: "Başqa açar sözlər ilə yenidən cəhd edin.",
  },
  orders: {
    icon: Inbox,
    title: "Sifariş yoxdur",
    description: "Hələ heç bir sifarişiniz yoxdur.",
  },
  files: {
    icon: FolderOpen,
    title: "Fayl yoxdur",
    description: "Hələ heç bir fayl yüklənməyib.",
  },
  notifications: {
    icon: FileX,
    title: "Bildiriş yoxdur",
    description: "Yeni bildirişiniz yoxdur.",
  },
};

export function EmptyState({
  type = "default",
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="w-20 h-20 rounded-full bg-[#F8F9FB] flex items-center justify-center mb-4">
        <Icon className="h-10 w-10 text-[#9CA3AF]" />
      </div>
      <h3 className="text-lg font-semibold text-[#1F2937] mb-2">
        {title || config.title}
      </h3>
      <p className="text-[#6B7280] max-w-sm mb-6">
        {description || config.description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="secondary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
