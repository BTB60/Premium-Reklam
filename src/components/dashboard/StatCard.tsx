"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  subtitle?: string;
  className?: string;
}

export function StatCard({ title, value, icon, trend, subtitle, className }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "bg-white rounded-xl p-4 border border-[#E5E7EB] hover:shadow-lg transition-all",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#6B7280] mb-1">{title}</p>
          <p className="text-2xl font-bold text-[#1F2937]">{value}</p>
          {subtitle && (
            <p className="text-xs text-[#9CA3AF] mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={cn(
              "text-xs mt-1",
              trend.startsWith("+") ? "text-emerald-500" : 
              trend.startsWith("-") ? "text-red-500" : "text-[#6B7280]"
            )}>
              {trend}
            </p>
          )}
        </div>
        <div className="w-10 h-10 bg-[#F8F9FB] rounded-lg flex items-center justify-center text-[#D90429]">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
