"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { orderApi, type Order } from "@/lib/authApi";
import { getOrderTotal, formatAZN } from "@/lib/orderHelpers";
import { 
  Search, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock,
  MapPin,
  Calendar,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async () => {
    if (!orderId.trim()) {
      setError("Sifariş kodunu daxil edin");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await orderApi.getOrdersFromBackend();
      const allOrders = data.orders || [];
      const query = orderId.trim().toLowerCase();
      const found = allOrders.find((o: any) => {
        const idText = String(o.id || "").toLowerCase();
        const numberText = String(o.orderNumber || "").toLowerCase();
        return idText.includes(query) || idText.slice(-6) === query || numberText.includes(query);
      });

      if (found) {
        setOrder(found as Order);
      } else {
        setError("Sifariş tapılmadı. Kodu yoxlayın.");
        setOrder(null);
      }
    } catch (error) {
      console.error("[Track] load orders error:", error);
      setError("Sifarişlər yüklənmədi.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusSteps = (status: Order["status"]) => {
    const steps = [
      { id: "pending", label: "Gözləyir", icon: Clock },
      { id: "approved", label: "Təsdiqləndi", icon: CheckCircle },
      { id: "design", label: "Dizayn", icon: Package },
      { id: "printing", label: "Çap", icon: Package },
      { id: "production", label: "İstehsal", icon: Package },
      { id: "ready", label: "Hazır", icon: Package },
      { id: "delivering", label: "Çatdırılma", icon: Truck },
      { id: "completed", label: "Tamamlandı", icon: CheckCircle },
    ];

    const statusIndex = steps.findIndex(s => s.id === status);
    return steps.map((step, index) => ({
      ...step,
      completed: index <= statusIndex,
      current: index === statusIndex,
    }));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Header />
      
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-[#1F2937] mb-2">
              Sifariş İzləmə
            </h1>
            <p className="text-[#6B7280]">
              Sifariş kodunuzu daxil edin və statusunu görün
            </p>
          </motion.div>

          <Card className="p-6 mb-8">
            <div className="flex gap-3">
              <Input
                placeholder="Sifariş kodu (məs: ABC123)"
                value={orderId}
                onChange={setOrderId}
                icon={<Search className="w-5 h-5" />}
                className="flex-1"
              />
              <Button 
                onClick={handleTrack}
                loading={loading}
                icon={<ArrowRight className="w-5 h-5" />}
              >
                İzlə
              </Button>
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </Card>

          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-[#6B7280]">Sifariş #{order.orderNumber}</p>
                    <p className="text-2xl font-bold text-[#1F2937]">
                      {order.totalAmount?.toFixed(2)} AZN
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {/* Progress Steps */}
                <div className="relative">
                  <div className="flex justify-between items-start">
                    {getStatusSteps(order.status).map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div key={step.id} className="flex flex-col items-center flex-1">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                              step.completed
                                ? step.current
                                  ? "bg-[#D90429] text-white"
                                  : "bg-emerald-500 text-white"
                                : "bg-gray-200 text-gray-400"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <p className={`text-xs text-center ${
                            step.current ? "text-[#D90429] font-medium" : "text-gray-500"
                          }`}>
                            {step.label}
                          </p>
                          {index < getStatusSteps(order.status).length - 1 && (
                            <div
                              className={`absolute top-5 h-0.5 ${
                                step.completed ? "bg-emerald-500" : "bg-gray-200"
                              }`}
                              style={{
                                left: `${(index * 100) / (getStatusSteps(order.status).length - 1) + 10}%`,
                                width: `${80 / (getStatusSteps(order.status).length - 1)}%`,
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-[#1F2937] mb-4">Sifariş Detalları</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Məhsul sayı:</span>
                    <span className="font-medium">{order.items.length} ədəd</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Yaradılma tarixi:</span>
                    <span className="font-medium">
                      {new Date(order.createdAt).toLocaleDateString("az-AZ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Ödəniş:</span>
                    <span className="font-medium capitalize">{order.paymentMethod}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
                  <Link href={`/dashboard/orders/${order.id}`}>
                    <Button variant="secondary" className="w-full">
                      Ətraflı məlumat
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
