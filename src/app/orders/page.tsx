"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { authApi, orderApi, type UserData, type Order } from "@/lib/authApi";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { 
  ArrowLeft, 
  Package, 
  Plus,
  Calendar,
  DollarSign,
  Search,
  Filter,
  Eye
} from "lucide-react";
import Link from "next/link";

export default function OrdersHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);

    orderApi
      .getMyOrders()
      .then((data) => {
        const list = data.orders || [];
        setUserOrders(list);
        setFilteredOrders(list);
      })
      .catch((error) => {
        console.error("[OrdersHistory] Load orders error:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    let filtered = userOrders;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((o) => {
        const idMatch = String(o.id).toLowerCase().includes(query);
        const numberMatch = (o.orderNumber || "").toLowerCase().includes(query);
        const itemsMatch = (o.items || []).some((i) =>
          (i.productName || "").toLowerCase().includes(query)
        );
        return idMatch || numberMatch || itemsMatch;
      });
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }
    
    setFilteredOrders(filtered);
  }, [searchQuery, statusFilter, userOrders]);

  const getStatusCount = (status: string) => {
    return userOrders.filter(o => o.status === status).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D90429]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Header />
      
      <main className="pt-20 pb-24 lg:pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
          >
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" icon={<ArrowLeft className="w-5 h-5" />}>
                  Geri
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-[#1F2937]">Sifariş tarixçəsi</h1>
                <p className="text-[#6B7280]">Ümumi {userOrders.length} sifariş</p>
              </div>
            </div>
            <Link href="/orders/new">
              <Button icon={<Plus className="w-5 h-5" />}>
                Yeni sifariş
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
          >
            {[
              { label: "Hamısı", value: userOrders.length, color: "bg-gray-100" },
              { label: "Gözləyir", value: getStatusCount("pending"), color: "bg-amber-100" },
              { label: "Hazırlanır", value: getStatusCount("production"), color: "bg-blue-100" },
              { label: "Hazır", value: getStatusCount("ready"), color: "bg-purple-100" },
              { label: "Tamamlandı", value: getStatusCount("completed"), color: "bg-green-100" },
            ].map((stat) => (
              <Card 
                key={stat.label}
                className={`p-4 cursor-pointer transition-all ${statusFilter === (stat.label === "Hamısı" ? "all" : stat.label === "Gözləyir" ? "pending" : stat.label === "Hazırlanır" ? "production" : stat.label === "Hazır" ? "ready" : stat.label === "Tamamlandı" ? "completed" : "all") ? "ring-2 ring-[#D90429]" : ""}`}
                onClick={() => setStatusFilter(stat.label === "Hamısı" ? "all" : stat.label === "Gözləyir" ? "pending" : stat.label === "Hazırlanır" ? "production" : stat.label === "Hazır" ? "ready" : stat.label === "Tamamlandı" ? "completed" : "all")}
              >
                <p className="text-2xl font-bold text-[#1F2937]">{stat.value}</p>
                <p className="text-xs text-[#6B7280]">{stat.label}</p>
              </Card>
            ))}
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row gap-4 mb-6"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Sifariş nömrəsi və ya məhsul axtar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D90429]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#6B7280]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D90429]"
              >
                <option value="all">Bütün statuslar</option>
                <option value="pending">Gözləyir</option>
                <option value="approved">Təsdiqləndi</option>
                <option value="design">Dizayn</option>
                <option value="printing">Çap</option>
                <option value="production">İstehsalat</option>
                <option value="ready">Hazır</option>
                <option value="delivering">Çatdırılma</option>
                <option value="completed">Tamamlandı</option>
                <option value="cancelled">Ləğv edildi</option>
              </select>
            </div>
          </motion.div>

          {/* Orders List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {filteredOrders.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-[#6B7280] mb-4">
                  {searchQuery || statusFilter !== "all" 
                    ? "Axtarışa uyğun sifariş tapılmadı" 
                    : "Hələ sifarişiniz yoxdur"}
                </p>
                <Link href="/orders/new">
                  <Button icon={<Plus className="w-4 h-4" />}>
                    Yeni sifariş yarat
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-bold text-[#1F2937]">
                            #{order.orderNumber}
                          </span>
                          <StatusBadge status={order.status} />
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-[#6B7280]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(order.createdAt).toLocaleDateString("az-AZ")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            {order.items.length} məhsul
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {order.paymentMethod === "cash" ? "Nəğd" : order.paymentMethod === "card" ? "Kart" : "Borc"}
                          </span>
                        </div>

                        {/* Products */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {order.items.map((item, idx) => (
                            <span 
                              key={idx}
                              className="text-xs px-2 py-1 bg-gray-100 rounded-lg text-[#6B7280]"
                            >
                              {item.productName} ({item.width}×{item.height}m)
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:flex-col md:items-end gap-2">
                        <p className="text-2xl font-bold text-[#D90429]">
                          {order.totalAmount?.toFixed(2)} AZN
                        </p>
                        <Link href={`/orders/${order.id}`}>
                          <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />}>
                            Ətraflı
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
