"use client";

import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ProductsHeaderBar({ onNewProduct }: { onNewProduct: () => void }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Package className="w-8 h-8 text-[#D90429]" />
        <h1 className="text-2xl font-bold text-[#1F2937]">Məhsullar</h1>
      </div>
      <Button onClick={onNewProduct} icon={<Plus className="w-4 h-4" />}>
        Yeni məhsul
      </Button>
    </div>
  );
}
