"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Backend-dən gələn enum-u frontend statusuna çevir
function normalizeStatus(status: string): string {
  const map: Record<string, string> = {
    'PENDING': 'pending',
    'CONFIRMED': 'approved',
    'IN_PROGRESS': 'design',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled',
    'CANCELED': 'cancelled',
  };
  const lower = status.toUpperCase();
  return map[lower] || status.toLowerCase();
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending: {
    label: "Gözləyir",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Təsdiqləndi",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  design: {
    label: "Dizayn",
    bg: "bg-violet-50",
    text: "text-violet-700",
    dot: "bg-violet-500",
  },
  printing: {
    label: "Çap",
    bg: "bg-fuchsia-50",
    text: "text-fuchsia-700",
    dot: "bg-fuchsia-500",
  },
  production: {
    label: "İstehsal",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    dot: "bg-indigo-500",
  },
  ready: {
    label: "Hazır",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  delivering: {
    label: "Çatdırılma",
    bg: "bg-teal-50",
    text: "text-teal-700",
    dot: "bg-teal-500",
  },
  completed: {
    label: "Tamamlandı",
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  cancelled: {
    label: "Ləğv edildi",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  paid: {
    label: "Ödənilib",
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  partial: {
    label: "Qismən ödəniş",
    bg: "bg-orange-50",
    text: "text-orange-700",
    dot: "bg-orange-500",
  },
};

const sizeConfig = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
};

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const normalizedStatus = normalizeStatus(status);
  const config = statusConfig[normalizedStatus] || {
    label: status,
    bg: "bg-gray-50",
    text: "text-gray-700",
    dot: "bg-gray-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bg,
        config.text,
        sizeConfig[size],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
