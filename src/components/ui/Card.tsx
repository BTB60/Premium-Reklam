"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover = true, onClick }: CardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? { y: -3, boxShadow: "0 18px 38px rgba(15, 23, 42, 0.16)" } : {}}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-2xl p-5 border border-[var(--border)]",
        "bg-[var(--card-glass)] backdrop-blur-xl",
        "shadow-[var(--shadow-sm)]",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral" | "warning";
  icon: ReactNode;
  className?: string;
}

export function StatCard({ title, value, change, changeType = "neutral", icon, className }: StatCardProps) {
  const changeColors = {
    positive: "text-[#16A34A]",
    negative: "text-[#DC2626]",
    neutral: "text-[#6B7280]",
    warning: "text-[#F59E0B]",
  };

  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#6B7280] text-sm font-medium">{title}</p>
          <h3 className="text-[28px] font-bold text-[#1F2937] mt-1 font-[Manrope]">{value}</h3>
          {change && (
            <p className={cn("text-sm mt-1 font-medium", changeColors[changeType])}>
              {change}
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#fff0e6] border border-[#ffd3b7] flex items-center justify-center text-[#ff6600] shadow-[0_0_14px_rgba(255,102,0,0.2)]">
          {icon}
        </div>
      </div>
    </Card>
  );
}

interface OrderCardProps {
  orderNumber: string;
  customer: string;
  date: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  onClick?: () => void;
}

export function OrderCard({ orderNumber, customer, date, amount, status, onClick }: OrderCardProps) {
  const statusStyles = {
    pending: "bg-[#F59E0B]/10 text-[#F59E0B]",
    processing: "bg-[#3B82F6]/10 text-[#3B82F6]",
    completed: "bg-[#16A34A]/10 text-[#16A34A]",
    cancelled: "bg-[#DC2626]/10 text-[#DC2626]",
  };

  const statusLabels = {
    pending: "Gözləyir",
    processing: "Hazırlanır",
    completed: "Tamamlandı",
    cancelled: "Ləğv edildi",
  };

  return (
    <Card onClick={onClick} className="cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#1F2937] font-semibold">{orderNumber}</p>
          <p className="text-[#6B7280] text-sm">{customer}</p>
        </div>
        <span className={cn("px-3 py-1 rounded-full text-sm font-medium", statusStyles[status])}>
          {statusLabels[status]}
        </span>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E5E7EB]">
        <span className="text-[#6B7280] text-sm">{date}</span>
        <span className="text-[#1F2937] font-bold">{amount} AZN</span>
      </div>
    </Card>
  );
}

interface ProductCardProps {
  name: string;
  description: string;
  price: number;
  image?: string;
  onSelect?: () => void;
  selected?: boolean;
}

export function ProductCard({ name, description, price, image, onSelect, selected }: ProductCardProps) {
  return (
    <Card 
      onClick={onSelect}
      className={cn(
        "cursor-pointer transition-all",
        selected && "ring-2 ring-[#ff6600] shadow-[0_0_20px_rgba(255,102,0,0.34)]"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-8 h-8 bg-[#ff6600]/15 rounded-lg" />
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-[#1F2937]">{name}</h4>
          <p className="text-[#6B7280] text-sm line-clamp-1">{description}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-[#ff6600]">{price} AZN</p>
        </div>
      </div>
    </Card>
  );
}
