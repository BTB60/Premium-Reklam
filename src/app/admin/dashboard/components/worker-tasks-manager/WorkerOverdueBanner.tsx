"use client";

import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function WorkerOverdueBanner({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <Card className="p-4 mb-6 bg-amber-50 border border-amber-200">
      <div className="flex items-center gap-2 text-amber-700">
        <AlertCircle className="w-5 h-5" />
        <span className="font-medium">{count} tapşırıq son tarixi keçib!</span>
      </div>
    </Card>
  );
}
