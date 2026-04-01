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
  const baseStyles = "relative font-semibold transition-all duration-300 rounded-[14px] flex items-center justify-center gap-2 whitespace-nowrap";
  
  const variants: Record<string, string> = {
    primary: "bg-[#D90429] text-white hover:bg-[#b80323] hover:shadow-lg hover:shadow-[#D90429]/25 active:scale-95",
    secondary: "bg-white text-[#D90429] border-2 border-[#D90429] hover:bg-[#D90429] hover:text-white active:scale-95",
    ghost: "bg-transparent text-[#1F2937] hover:bg-gray-100 active:scale-95",
    danger: "bg-[#DC2626] text-white hover:bg-[#b91c1c] active:scale-95",
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
