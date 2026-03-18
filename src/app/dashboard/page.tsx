"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { orderApi, productApi, authApi, type Order, type Product } from "@/lib/authApi";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { motion } from "framer-motion";
import { 
  LogOut, 
  Package, 
  Bell, 
  Settings, 
  Award,
  Plus,
  Eye,
  DollarSign,
  Clock,
  CheckCircle,
  User,
  ShoppingBag,
  RefreshCw
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "products" | "orders">("home");

  // New order form state
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderForm, setOrderForm] = useState({
    width: "",
    height: "",
    quantity: "1",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    note: "",
  });
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    const currentUser = authApi.getCurrentUser();

    if (!currentUser) {
      router.push("/login");
      return;
    }

    setUser(currentUser);
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, productsData] = await Promise.all([
        orderApi.getMyOrders(),
        productApi.getAll(),
      ]);
      setUserOrders(ordersData || []);
      setProducts(productsData.filter((p: Product) => p.status === "ACTIVE") || []);
    } catch (error) {
      console.error("Data load error:", error);
      setUserOrders([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    authApi.logout();
    router.push("/login");
  };

  const handleCreateOrder = async () => {
    if (!selectedProduct || !orderForm.width || !orderForm.height || !orderForm.customerName) {
      alert("Zəhmət olmasa bütün məlumatları doldurun");
      return;
    }

    setOrderLoading(true);
    try {
      const width = parseFloat(orderForm.width);
      const height = parseFloat(orderForm.height);
      const quantity = parseInt(orderForm.quantity) || 1;
      const area = width * height;
      const unitPrice = selectedProduct.salePrice;
      const lineTotal = area * quantity * unitPrice;

      await orderApi.create({
        customerName: orderForm.customerName,
        customerPhone: orderForm.customerPhone,
        customerAddress: orderForm.customerAddress,
        note: orderForm.note,
        discountPercent: 0,
        items: [{
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          unit: selectedProduct.unit,
          quantity: quantity,
          width: width,
          height: height,
          unitPrice: unitPrice,
          note: "",
        }],
      });

      alert("Sifariş uğurla yaradıldı!");
      setShowNewOrder(false);
      setSelectedProduct(null);
      setOrderForm({
        width: "",
        height: "",
        quantity: "1",
        customerName: "",
        customerPhone: "",
        customerAddress: "",
        note: "",
      });
      loadData();
    } catch (error: any) {
      alert(error.message || "Sifariş yaradılmadı");
    } finally {
      setOrderLoading(false);
    }
  };

  // Calculate stats
  const totalSpent = userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const completedOrders = userOrders.filter(o => o.status === "COMPLETED").length;
  const pendingOrders = userOrders.filter(o => o.status === "PENDING").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E5E7EB] border-t-[#D90429] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#D90429] to-[#EF476F] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1F2937]">Premium Reklam</h1>
              <p className="text-xs text-[#6B7280]">Xoş gəldin, {user.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRefresh} icon={<RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />}>
                <span className="sr-only">Yenile</span>
              </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} icon={<LogOut className="w-4 h-4" />}>
              Çıxış
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-[#E5E7EB] px-6">
        <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto">
          {[
            { id: "home", label: "Ana Səhifə", icon: User },
            { id: "products", label: "Məhsullar", icon: ShoppingBag },
            { id: "orders", label: "Sifarişlərim", icon: Package },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-4 border-b-2 whitespace-nowrap text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-[#D90429] text-[#D90429]"
                  : "border-transparent text-[#6B7280] hover:text-[#1F2937]"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        
        {/* Home Tab */}
        {activeTab === "home" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* User Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#D90429]/10 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-[#D90429]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Ümumi Sifariş</p>
                    <p className="text-2xl font-bold text-[#1F2937]">{userOrders.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#16A34A]/10 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-[#16A34A]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Tamamlanan</p>
                    <p className="text-2xl font-bold text-[#1F2937]">{completedOrders}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#F59E0B]/10 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-[#F59E0B]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Gözləyən</p>
                    <p className="text-2xl font-bold text-[#1F2937]">{pendingOrders}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#3B82F6]/10 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-[#3B82F6]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Ümumi Xərc</p>
                    <p className="text-2xl font-bold text-[#1F2937]">{totalSpent.toFixed(2)}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Order Button */}
            <Card className="p-6 mb-6 bg-gradient-to-r from-[#D90429] to-[#EF476F] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-1">Yeni Sifariş Ver</h3>
                  <p className="opacity-90 text-sm">Asan və sürətli sifariş</p>
                </div>
                <Button 
                  onClick={() => setActiveTab("products")}
                  className="bg-white text-[#D90429] hover:bg-gray-100"
                  icon={<Plus className="w-4 h-4" />}
                >
                  Sifariş Et
                </Button>
              </div>
            </Card>

            {/* Recent Orders */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#1F2937]">Son Sifarişlər</h2>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("orders")}>
                  Hamısına Bax
                </Button>
              </div>
              
              {userOrders.length === 0 ? (
                <Card className="p-10 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-[#6B7280] mb-4">Hələ sifarişiniz yoxdur</p>
                  <Button onClick={() => setActiveTab("products")} icon={<Plus className="w-4 h-4" />}>
                    Sifariş Et
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {userOrders.slice(0, 5).map((order) => (
                    <Card key={order.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-[#1F2937]">#{order.orderNumber}</p>
                        <p className="text-xs text-[#6B7280]">
                          {new Date(order.createdAt).toLocaleDateString("az-AZ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-[#1F2937]">{order.totalAmount?.toFixed(2)} AZN</p>
                          <p className="text-xs text-[#6B7280]">{order.items?.length || 0} məhsul</p>
                        </div>
                        <StatusBadge status={order.status?.toLowerCase() || "pending"} />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Products Tab - New Order */}
        {activeTab === "products" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-[#1F2937]">Məhsullar və Sifariş</h1>
            </div>

            {!showNewOrder ? (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <Card key={product.id} className="p-5 cursor-pointer" onClick={() => {
                      setSelectedProduct(product);
                      setShowNewOrder(true);
                    }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 bg-[#D90429]/10 rounded-xl flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-[#D90429]" />
                        </div>
                        <span className="text-xs bg-gray-100 text-[#6B7280] px-2 py-1 rounded">
                          {product.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-[#1F2937] mb-1">{product.name}</h3>
                      <p className="text-sm text-[#6B7280] mb-3">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-[#D90429]">{product.salePrice} AZN</span>
                        <span className="text-xs text-[#6B7280]">/{product.unit}</span>
                      </div>
                      {product.width && product.height && (
                        <p className="text-xs text-[#6B7280] mt-2">
                          Standart: {product.width}m × {product.height}m
                        </p>
                      )}
                    </Card>
                  ))}
                </div>

                {products.length === 0 && (
                  <Card className="p-16 text-center">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[#1F2937] mb-2">Məhsul yoxdur</h3>
                    <p className="text-[#6B7280]">Admin məhsul əlavə edəcək</p>
                  </Card>
                )}
              </>
            ) : (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#1F2937]">
                    Yeni Sifariş - {selectedProduct?.name}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setShowNewOrder(false);
                    setSelectedProduct(null);
                  }}>
                    Ləğv et
                  </Button>
                </div>

                {/* Product Info */}
                <div className="bg-[#F9FAFB] rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#6B7280]">Seçilmiş məhsul</p>
                      <p className="font-bold text-[#1F2937]">{selectedProduct?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#6B7280]">Qiymət</p>
                      <p className="text-xl font-bold text-[#D90429]">{selectedProduct?.salePrice} AZN/{selectedProduct?.unit}</p>
                    </div>
                  </div>
                </div>

                {/* Order Form */}
                <div className="grid gap-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-[#6B7280] mb-2">En (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={orderForm.width}
                        onChange={(e) => setOrderForm({...orderForm, width: e.target.value})}
                        className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#6B7280] mb-2">Hündürlük (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={orderForm.height}
                        onChange={(e) => setOrderForm({...orderForm, height: e.target.value})}
                        className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#6B7280] mb-2">Ədəd</label>
                      <input
                        type="number"
                        min="1"
                        value={orderForm.quantity}
                        onChange={(e) => setOrderForm({...orderForm, quantity: e.target.value})}
                        className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Calculated Total */}
                  {orderForm.width && orderForm.height && selectedProduct && (
                    <div className="bg-[#D90429]/5 rounded-xl p-4 border border-[#D90429]/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-[#6B7280]">Ümumi sahə</p>
                          <p className="text-2xl font-bold text-[#1F2937]">
                            {(parseFloat(orderForm.width) * parseFloat(orderForm.height) * (parseInt(orderForm.quantity) || 1)).toFixed(2)} m²
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#6B7280]">Ümumi qiymət</p>
                          <p className="text-2xl font-bold text-[#D90429]">
                            {(
                              parseFloat(orderForm.width) * 
                              parseFloat(orderForm.height) * 
                              (parseInt(orderForm.quantity) || 1) * 
                              selectedProduct.salePrice
                            ).toFixed(2)} AZN
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-[#6B7280] mb-2">Müştəri Adı *</label>
                    <input
                      type="text"
                      value={orderForm.customerName}
                      onChange={(e) => setOrderForm({...orderForm, customerName: e.target.value})}
                      className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg"
                      placeholder="Ad Soyad"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#6B7280] mb-2">Telefon</label>
                    <input
                      type="tel"
                      value={orderForm.customerPhone}
                      onChange={(e) => setOrderForm({...orderForm, customerPhone: e.target.value})}
                      className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg"
                      placeholder="050 000 00 00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#6B7280] mb-2">Ünvan</label>
                    <input
                      type="text"
                      value={orderForm.customerAddress}
                      onChange={(e) => setOrderForm({...orderForm, customerAddress: e.target.value})}
                      className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg"
                      placeholder="Bakı, Nərimanov rayonu..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#6B7280] mb-2">Qeyd</label>
                    <textarea
                      value={orderForm.note}
                      onChange={(e) => setOrderForm({...orderForm, note: e.target.value})}
                      className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg"
                      rows={3}
                      placeholder="Əlavə qeydləriniz..."
                    />
                  </div>

                  <Button 
                    onClick={handleCreateOrder} 
                    className="w-full"
                    disabled={orderLoading || !orderForm.width || !orderForm.height || !orderForm.customerName}
                    icon={orderLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  >
                    {orderLoading ? "Gözləyin..." : "Sifarişi Tamamla"}
                  </Button>
                </div>
              </Card>
            )}
          </motion.div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-[#1F2937]">Sifarişlərim</h1>
              <Button onClick={() => setActiveTab("products")} icon={<Plus className="w-4 h-4" />}>
                Yeni Sifariş
              </Button>
            </div>

            {userOrders.length === 0 ? (
              <Card className="p-16 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#1F2937] mb-2">Sifariş yoxdur</h3>
                <p className="text-[#6B7280] mb-6">İlk sifarişinizi verin</p>
                <Button onClick={() => setActiveTab("products")} icon={<Plus className="w-4 h-4" />}>
                  Sifariş Et
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {userOrders.map((order) => (
                  <Card key={order.id} className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-bold text-[#1F2937] text-lg">#{order.orderNumber}</p>
                        <p className="text-sm text-[#6B7280]">
                          {new Date(order.createdAt).toLocaleString("az-AZ")}
                        </p>
                      </div>
                      <StatusBadge status={order.status?.toLowerCase() || "pending"} />
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm bg-[#F9FAFB] rounded-lg p-3">
                          <span className="text-[#1F2937]">{item.productName}</span>
                          <span className="text-[#6B7280]">
                            {item.width && item.height ? `${item.width}×${item.height}m` : ""} 
                            {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                          </span>
                          <span className="font-semibold text-[#1F2937]">{item.lineTotal?.toFixed(2)} AZN</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                      <div>
                        <p className="text-sm text-[#6B7280]">Müştəri</p>
                        <p className="font-semibold text-[#1F2937]">{order.customerName}</p>
                        {order.customerPhone && <p className="text-sm text-[#6B7280]">{order.customerPhone}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[#6B7280]">Ümumi</p>
                        <p className="text-2xl font-bold text-[#D90429]">{order.totalAmount?.toFixed(2)} AZN</p>
                      </div>
                    </div>

                    {order.note && (
                      <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                        <p className="text-sm text-[#6B7280]">Qeyd:</p>
                        <p className="text-sm text-[#1F2937]">{order.note}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
