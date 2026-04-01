"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/authApi";
import { vendorStores, vendorOrders, type VendorStore, type VendorOrder } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";
import { 
  Store, 
  Package,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Phone,
  MapPin,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  User,
  Eye
} from "lucide-react";
import Link from "next/link";

type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "Gözləyən", color: "text-amber-600", bg: "bg-amber-100", icon: Clock },
  confirmed: { label: "Təsdiqlənmiş", color: "text-blue-600", bg: "bg-blue-100", icon: CheckCircle },
  shipped: { label: "Göndərilib", color: "text-purple-600", bg: "bg-purple-100", icon: Truck },
  delivered: { label: "Tamamlanmış", color: "text-emerald-600", bg: "bg-emerald-100", icon: CheckCircle },
  cancelled: { label: "Ləğv Edilmiş", color: "text-red-600", bg: "bg-red-100", icon: XCircle },
};

export default function VendorOrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myStore, setMyStore] = useState<VendorStore | null>(null);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = authApi.getCurrentUser() as any;

    if (!currentUser) {
      router.push("/login");
      return;
    }

    setUser(currentUser);
    
    const store = vendorStores.getByVendorId(currentUser.id);
    if (!store?.isApproved) {
      router.push("/dashboard/store");
      return;
    }
    
    setMyStore(store);
    setOrders(vendorOrders.getByVendorId(currentUser.id));
    setLoading(false);
  }, [router]);

  const filteredOrders = filterStatus === "all" 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setUpdating(orderId);
    vendorOrders.updateStatus(orderId, newStatus);
    
    // Refresh orders
    setTimeout(() => {
      setOrders(vendorOrders.getByVendorId(user.id));
      setUpdating(null);
    }, 300);
  };

  const getNextStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
    const flow: Record<OrderStatus, OrderStatus[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["shipped", "cancelled"],
      shipped: ["delivered", "cancelled"],
      delivered: [],
      cancelled: [],
    };
    return flow[currentStatus];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E5E7EB] border-t-[#D90429] rounded-full animate-spin" />
      </div>
    );
  }

  if (!myStore) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <p>Mağaza tapılmadı</p>
      </div>
    );
  }

  const pendingCount = orders.filter(o => o.status === "pending").length;

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/dashboard/store" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[#1F2937]">Sifarişlərim</h1>
            <p className="text-xs text-[#6B7280]">{myStore.name}</p>
          </div>
          {pendingCount > 0 && (
            <div className="bg-[#D90429] text-white px-3 py-1 rounded-full text-sm font-medium">
              {pendingCount} gözləyən
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filterStatus === "all" 
                  ? "bg-[#D90429] text-white" 
                  : "bg-white text-[#6B7280] hover:bg-gray-100"
              }`}
            >
              Hamısı ({orders.length})
            </button>
            {(Object.keys(statusConfig) as OrderStatus[]).map((status) => {
              const count = orders.filter(o => o.status === status).length;
              if (count === 0) return null;
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    filterStatus === status 
                      ? "bg-[#D90429] text-white" 
                      : "bg-white text-[#6B7280] hover:bg-gray-100"
                  }`}
                >
                  {statusConfig[status].label} ({count})
                </button>
              );
            })}
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-20 h-20 bg-[#D90429]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-[#D90429]" />
              </div>
              <h2 className="text-xl font-bold text-[#1F2937] mb-2">
                {filterStatus === "all" ? "Hələ sifariş yoxdur" : `${statusConfig[filterStatus as OrderStatus].label} sifariş yoxdur`}
              </h2>
              <p className="text-[#6B7280]">
                Müştərilər mağazanızdan məhsul sifariş etdikdə burda görünəcək
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const statusInfo = statusConfig[order.status];
                const StatusIcon = statusInfo.icon;
                const isExpanded = expandedOrder === order.id;
                const nextStatuses = getNextStatuses(order.status);

                return (
                  <Card key={order.id} className="overflow-hidden">
                    {/* Order Header */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Order ID & Date */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1F2937]">{order.orderId}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                              <StatusIcon className="w-3 h-3 inline mr-1" />
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-sm text-[#6B7280] mt-1">
                            {new Date(order.createdAt).toLocaleDateString("az-AZ", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {/* Customer */}
                        <div className="text-right">
                          <p className="font-medium text-[#1F2937]">{order.customerName}</p>
                          <p className="text-sm text-[#6B7280]">{order.items.length} məhsul</p>
                        </div>

                        {/* Total */}
                        <div className="text-right">
                          <p className="text-xl font-bold text-[#D90429]">
                            {(order.subtotal).toFixed(2)} AZN
                          </p>
                        </div>

                        {/* Expand Icon */}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50 p-4 space-y-4">
                        {/* Customer Info */}
                        <div className="bg-white rounded-lg p-4">
                          <h4 className="font-semibold text-[#1F2937] mb-3 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Müştəri Məlumatları
                          </h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#D90429]/10 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-[#D90429]" />
                              </div>
                              <div>
                                <p className="text-sm text-[#6B7280]">Ad</p>
                                <p className="font-medium">{order.customerName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#D90429]/10 rounded-full flex items-center justify-center">
                                <Phone className="w-5 h-5 text-[#D90429]" />
                              </div>
                              <div>
                                <p className="text-sm text-[#6B7280]">Telefon</p>
                                <a href={`tel:${order.customerPhone}`} className="font-medium text-[#D90429] hover:underline">
                                  {order.customerPhone}
                                </a>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 md:col-span-2">
                              <div className="w-10 h-10 bg-[#D90429]/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-5 h-5 text-[#D90429]" />
                              </div>
                              <div>
                                <p className="text-sm text-[#6B7280]">Ünvan</p>
                                <p className="font-medium">{order.customerAddress}</p>
                              </div>
                            </div>
                          </div>
                          {order.notes && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="flex items-start gap-3">
                                <MessageSquare className="w-5 h-5 text-[#6B7280] mt-0.5" />
                                <div>
                                  <p className="text-sm text-[#6B7280]">Qeyd</p>
                                  <p className="font-medium">{order.notes}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Order Items */}
                        <div className="bg-white rounded-lg p-4">
                          <h4 className="font-semibold text-[#1F2937] mb-3 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Sifariş Məhsulları
                          </h4>
                          <div className="space-y-3">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                                <div>
                                  <p className="font-medium">{item.productName}</p>
                                  <p className="text-sm text-[#6B7280]">{item.quantity} x {item.price.toFixed(2)} AZN</p>
                                </div>
                                <p className="font-bold">{item.total.toFixed(2)} AZN</p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 pt-4 border-t space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-[#6B7280]">Məbləğ</span>
                              <span>{order.subtotal.toFixed(2)} AZN</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-[#6B7280]">Komissiya (5%)</span>
                              <span>-{order.commission.toFixed(2)} AZN</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-2 border-t">
                              <span>Sizin gəliriniz</span>
                              <span className="text-emerald-600">{order.vendorTotal.toFixed(2)} AZN</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        {nextStatuses.length > 0 && (
                          <div className="bg-white rounded-lg p-4">
                            <h4 className="font-semibold text-[#1F2937] mb-3">Əməliyyatlar</h4>
                            <div className="flex flex-wrap gap-2">
                              {nextStatuses.map((status) => {
                                const config = statusConfig[status];
                                const Icon = config.icon;
                                return (
                                  <Button
                                    key={status}
                                    size="sm"
                                    variant={status === "cancelled" ? "ghost" : "secondary"}
                                    onClick={() => updateOrderStatus(order.id, status)}
                                    disabled={updating === order.id}
                                    className={status === "cancelled" ? "text-red-500 hover:bg-red-50" : ""}
                                    icon={<Icon className="w-4 h-4" />}
                                  >
                                    {status === "cancelled" ? "Ləğv Et" : 
                                     status === "confirmed" ? "Təsdiqlə" :
                                     status === "shipped" ? "Göndər" :
                                     status === "delivered" ? "Tamamla" : config.label}
                                  </Button>
                                );
                              })}
                              <a 
                                href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`} 
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button size="sm" variant="secondary" icon={<MessageSquare className="w-4 h-4" />}>
                                  WhatsApp
                                </Button>
                              </a>
                              <a href={`tel:${order.customerPhone}`}>
                                <Button size="sm" variant="secondary" icon={<Phone className="w-4 h-4" />}>
                                  Zəng Et
                                </Button>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
