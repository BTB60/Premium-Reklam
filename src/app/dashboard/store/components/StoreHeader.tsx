"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function StoreHeader({ title }: { title: string }) {
  return (
    <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-[#1F2937]">{title}</h1>
          <p className="text-xs text-[#6B7280]">Marketplace</p>
        </div>
      </div>
    </header>
  );
}