"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Clock, 
  Package, 
  Truck, 
  FileCheck,
  Printer,
  Palette,
  UserCheck
} from "lucide-react";

export type OrderStatus = 
  | "pending"      // Gözləyir
  | "approved"     // Təsdiqləndi
  | "design"       // Dizayn mərhələsi
  | "printing"     // Çap mərhələsi
  | "production"   // Hazırlanır
  | "ready"        // Hazır
  | "delivering"   // Çatdırılır
  | "completed"    // Tamamlandı
  | "cancelled";   // Ləğv edildi

interface TimelineStep {
  status: OrderStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const timelineSteps: TimelineStep[] = [
  { 
    status: "pending", 
    label: "Gözləyir", 
    description: "Sifariş təsdiqi gözləyir",
    icon: <Clock className="w-5 h-5" />
  },
  { 
    status: "approved", 
    label: "Təsdiqləndi", 
    description: "Admin tərəfindən təsdiqləndi",
    icon: <UserCheck className="w-5 h-5" />
  },
  { 
    status: "design", 
    label: "Dizayn", 
    description: "Dizayn yoxlanılır",
    icon: <Palette className="w-5 h-5" />
  },
  { 
    status: "printing", 
    label: "Çap", 
    description: "Çap prosesi davam edir",
    icon: <Printer className="w-5 h-5" />
  },
  { 
    status: "production", 
    label: "Hazırlanır", 
    description: "Məhsul hazırlanır",
    icon: <Package className="w-5 h-5" />
  },
  { 
    status: "ready", 
    label: "Hazır", 
    description: "Təhvil üçün hazırdır",
    icon: <FileCheck className="w-5 h-5" />
  },
  { 
    status: "delivering", 
    label: "Çatdırılır", 
    description: "Çatdırılma prosesində",
    icon: <Truck className="w-5 h-5" />
  },
  { 
    status: "completed", 
    label: "Tamamlandı", 
    description: "Sifariş tamamlandı",
    icon: <CheckCircle2 className="w-5 h-5" />
  },
];

const workflowToTimelineStatus: Record<string, OrderStatus> = {
  "təsdiq": "pending",
  "tesdiq": "pending",
  "ödəniş": "approved",
  "odenis": "approved",
  "dizayn": "design",
  "istehsal": "production",
  "kuryer": "delivering",
  "bitdi": "completed",
  pending: "pending",
  approved: "approved",
  confirmed: "approved",
  design: "design",
  printing: "printing",
  production: "production",
  ready: "ready",
  delivering: "delivering",
  completed: "completed",
  cancelled: "cancelled",
  canceled: "cancelled",
};

export function normalizeOrderTimelineStatus(status?: string | null): OrderStatus {
  const key = String(status || "pending").toLowerCase().trim();
  return workflowToTimelineStatus[key] || "pending";
}

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  className?: string;
}

export function OrderTimeline({ currentStatus, className }: OrderTimelineProps) {
  const normalizedStatus = normalizeOrderTimelineStatus(currentStatus);
  const currentIndex = timelineSteps.findIndex(step => step.status === normalizedStatus);
  
  // Filter out cancelled from normal flow
  if (normalizedStatus === "cancelled") {
    return (
      <div className={cn("p-4 bg-[#DC2626]/10 rounded-xl border border-[#DC2626]/20", className)}>
        <div className="flex items-center gap-3 text-[#DC2626]">
          <div className="w-10 h-10 rounded-full bg-[#DC2626]/20 flex items-center justify-center">
            <span className="text-lg">✕</span>
          </div>
          <div>
            <p className="font-semibold">Sifariş Ləğv Edildi</p>
            <p className="text-sm opacity-80">Bu sifariş ləğv olunub</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {timelineSteps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        
        return (
          <motion.div
            key={step.status}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "flex items-start gap-4",
              !isCompleted && "opacity-50"
            )}
          >
            {/* Icon */}
            <div className="relative">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  isCompleted
                    ? "bg-[#D90429] text-white"
                    : "bg-gray-200 text-gray-400",
                  isCurrent && "ring-4 ring-[#D90429]/20"
                )}
              >
                {step.icon}
              </div>
              {index < timelineSteps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-10 left-1/2 w-0.5 h-8 -translate-x-1/2",
                    index < currentIndex ? "bg-[#D90429]" : "bg-gray-200"
                  )}
                />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 pb-6">
              <h4
                className={cn(
                  "font-semibold",
                  isCurrent ? "text-[#D90429]" : "text-[#1F2937]"
                )}
              >
                {step.label}
                {isCurrent && (
                  <span className="ml-2 text-xs bg-[#D90429]/10 text-[#D90429] px-2 py-0.5 rounded-full">
                    Hazırda
                  </span>
                )}
              </h4>
              <p className="text-sm text-[#6B7280]">{step.description}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function CompactOrderTimeline({ status, className }: { status: string; className?: string }) {
  const normalizedStatus = normalizeOrderTimelineStatus(status);

  if (normalizedStatus === "cancelled") {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-red-600", className)}>
        <span className="w-2 h-2 rounded-full bg-red-500" />
        Sifariş ləğv edilib
      </div>
    );
  }

  const currentIndex = Math.max(0, timelineSteps.findIndex((step) => step.status === normalizedStatus));
  const visibleSteps = timelineSteps.filter((step) =>
    ["pending", "approved", "design", "production", "delivering", "completed"].includes(step.status)
  );
  const visibleCurrentIndex = Math.max(
    0,
    visibleSteps.findIndex((step) => step.status === normalizedStatus)
  );
  const progress = timelineSteps.length > 1 ? (currentIndex / (timelineSteps.length - 1)) * 100 : 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#D90429] transition-all"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <div className="flex justify-between gap-1">
        {visibleSteps.map((step, index) => {
          const active = index <= visibleCurrentIndex;
          const current = index === visibleCurrentIndex;
          return (
            <div key={step.status} className="flex flex-col items-center gap-1 min-w-0">
              <span
                className={cn(
                  "w-2.5 h-2.5 rounded-full ring-2 ring-white",
                  active ? "bg-[#D90429]" : "bg-gray-300",
                  current && "shadow-[0_0_0_4px_rgba(217,4,41,0.12)]"
                )}
              />
              <span
                className={cn(
                  "hidden sm:block text-[10px] truncate max-w-[4.5rem]",
                  current ? "text-[#D90429] font-semibold" : "text-[#9CA3AF]"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for cards
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const statusConfig = {
    pending: { label: "Gözləyir", color: "bg-[#F59E0B]/10 text-[#F59E0B]" },
    approved: { label: "Təsdiqləndi", color: "bg-[#3B82F6]/10 text-[#3B82F6]" },
    design: { label: "Dizayn", color: "bg-[#8B5CF6]/10 text-[#8B5CF6]" },
    printing: { label: "Çap", color: "bg-[#EC4899]/10 text-[#EC4899]" },
    production: { label: "Hazırlanır", color: "bg-[#06B6D4]/10 text-[#06B6D4]" },
    ready: { label: "Hazır", color: "bg-[#10B981]/10 text-[#10B981]" },
    delivering: { label: "Çatdırılır", color: "bg-[#6366F1]/10 text-[#6366F1]" },
    completed: { label: "Tamamlandı", color: "bg-[#16A34A]/10 text-[#16A34A]" },
    cancelled: { label: "Ləğv edildi", color: "bg-[#DC2626]/10 text-[#DC2626]" },
  };

  const config = statusConfig[normalizeOrderTimelineStatus(status)];

  return (
    <span className={cn("px-3 py-1 rounded-full text-sm font-medium", config.color)}>
      {config.label}
    </span>
  );
}
