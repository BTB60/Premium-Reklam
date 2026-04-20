"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface ButtonProps {
  children?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  icon?: ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  onClick,
  disabled = false,
  loading = false,
  type = "button",
  icon,
}: ButtonProps) {
  const baseStyles =
    "relative font-semibold transition-all duration-300 rounded-xl flex items-center justify-center gap-2 whitespace-nowrap hover:scale-[1.02] active:scale-[0.98]";
  
  const variants: Record<string, string> = {
    primary:
      "bg-gradient-to-br from-[#ff6600] to-[#d95500] text-white border border-[#ff7d2b] shadow-[0_10px_26px_rgba(255,102,0,0.34)] hover:shadow-[0_0_24px_rgba(255,102,0,0.58)]",
    secondary:
      "bg-white/80 text-[#131313] border border-[#ffd2b5] hover:border-[#ff6600] hover:text-[#ff6600] hover:bg-[#fff4ec] shadow-[0_8px_20px_rgba(15,23,42,0.08)]",
    ghost: "bg-transparent text-[#1f2937] hover:bg-black/5",
    danger:
      "bg-[#111111] text-[#ff8b45] border border-[#2a2a2a] hover:bg-[#1b1b1b] hover:shadow-[0_0_16px_rgba(255,102,0,0.25)]",
  };

  const sizes: Record<string, string> = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.98 }}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        (disabled || loading) && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
}
