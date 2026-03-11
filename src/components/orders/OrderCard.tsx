"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card } from "@/components/ui/Card";
import { ArrowRight, Package } from "lucide-react";
import { Order } from "@/lib/db";

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      <Link href={`/orders/${order.id}`}>
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#F8F9FB] rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-[#D90429]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[#1F2937]">#{order.id.slice(-6)}</p>
                  <StatusBadge status={order.status} size="sm" />
                </div>
                <p className="text-sm text-[#6B7280]">
                  {totalItems} məhsul • {order.finalTotal.toFixed(2)} AZN
                </p>
                <p className="text-xs text-[#9CA3AF]">
                  {new Date(order.createdAt).toLocaleDateString("az-AZ")}
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#9CA3AF]" />
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
