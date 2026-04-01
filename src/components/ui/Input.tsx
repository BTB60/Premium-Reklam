"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: "text" | "email" | "password" | "number" | "tel";
  icon?: ReactNode;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export function Input({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  icon,
  error,
  success,
  disabled,
  className,
  required,
}: InputProps) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-[#1F2937] mb-2">
          {label}
          {required && <span className="text-[#D90429] ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full h-12 rounded-[14px] border px-4 text-base transition-all duration-300",
            "focus:outline-none focus:ring-0",
            icon && "pl-12",
            error
              ? "border-[#DC2626] focus:border-[#DC2626]"
              : success
              ? "border-[#16A34A] focus:border-[#16A34A]"
              : "border-[#E5E7EB] focus:border-[#D90429]",
            disabled && "bg-gray-50 cursor-not-allowed"
          )}
        />
        {success && !error && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#16A34A]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-[#DC2626]">{error}</p>
      )}
    </div>
  );
}

interface TextAreaProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  rows?: number;
  error?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export function TextArea({
  label,
  placeholder,
  value,
  onChange,
  rows = 4,
  error,
  disabled,
  className,
  required,
}: TextAreaProps) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-[#1F2937] mb-2">
          {label}
          {required && <span className="text-[#D90429] ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={cn(
          "w-full rounded-[14px] border px-4 py-3 text-base transition-all duration-300 resize-none",
          "focus:outline-none focus:ring-0",
          error
            ? "border-[#DC2626] focus:border-[#DC2626]"
            : "border-[#E5E7EB] focus:border-[#D90429]",
          disabled && "bg-gray-50 cursor-not-allowed"
        )}
      />
      {error && (
        <p className="mt-1 text-sm text-[#DC2626]">{error}</p>
      )}
    </div>
  );
}

interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  disabled,
  className,
  required,
}: SelectProps) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-[#1F2937] mb-2">
          {label}
          {required && <span className="text-[#D90429] ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={cn(
          "w-full h-12 rounded-[14px] border px-4 text-base transition-all duration-300",
          "focus:outline-none focus:ring-0 appearance-none bg-white",
          error
            ? "border-[#DC2626] focus:border-[#DC2626]"
            : "border-[#E5E7EB] focus:border-[#D90429]",
          disabled && "bg-gray-50 cursor-not-allowed"
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 16px center",
          backgroundSize: "20px",
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-[#DC2626]">{error}</p>
      )}
    </div>
  );
}
