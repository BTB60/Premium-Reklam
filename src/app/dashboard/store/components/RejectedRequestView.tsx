"use client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { XCircle, Plus } from "lucide-react";
import type { StoreRequest } from "@/lib/db";

export default function RejectedRequestView({ 
  request, 
  onRetry 
}: { 
  request: StoreRequest; 
  onRetry: () => void; 
}) {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-red-500 to-red-600 text-white">
        <div className="flex items-center gap-4"><div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center"><XCircle className="w-8 h-8" /></div><div><h2 className="text-2xl font-bold">Rədd Edildi</h2><p className="opacity-90">Admin tərəfindən rədd edilmişdir</p></div></div>
      </Card>
      {request.rejectionReason && (
        <Card className="p-6 border-red-200 bg-red-50">
          <h3 className="font-bold text-red-700 mb-2">Səbəb</h3>
          <p className="text-red-600">{request.rejectionReason}</p>
        </Card>
      )}
      <Button onClick={onRetry} icon={<Plus className="w-4 h-4" />}>Yenidən Müraciət Et</Button>
    </div>
  );
}