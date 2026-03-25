"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { orderApi, productApi, authApi, type Order, type Product, type OrderSummary } from "@/lib/authApi";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { motion, AnimatePresence } from "framer-motion";
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
  RefreshCw,
  Store,
  AlertCircle,
  TrendingUp,
  Wallet,
  CreditCard,
  Banknote,
  X
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "products" | "orders">("home");

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentOrderId, setPaymentOrderId] = useState<number | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

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
      const user = authApi.getCurrentUser();
      const userId = user?.userId;
      
      const [ordersResponse, productsData] = await Promise.all([
        orderApi.getOrdersFromNeon(userId ? { userId: String(userId) } : {}),
        productApi.getAll(),
      ]);
      // Handle new API response format
      const ordersData = ordersResponse as any;
      const orders = ordersData.orders || [];
      setUserOrders(orders);
      
      // Calculate summary from orders
      const today = new Date().toISOString().split('T')[0];
      const monthStart = today.substring(0, 7) + '-01';
      
      const todayOrders = orders.filter((o: any) => {
        const orderDate = (o.created_at || '').split('T')[0];
        return orderDate === today;
      });
      
      const monthOrders = orders.filter((o: any) => {
        const orderDate = o.created_at || '';
        return orderDate >= monthStart;
      });
      
      const activeOrders = orders.filter((o: any) => o.payment_status !== 'CANCELLED');
      
      const summary = {
        todayOrderCount: todayOrders.length,
        todayOrderAmount: todayOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0),
        monthOrderCount: monthOrders.length,
        monthOrderAmount: monthOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0),
        totalPaid: activeOrders.reduce((sum: number, o: any) => sum + Number(o.paid_amount || 0), 0),
        totalDebt: activeOrders.reduce((sum: number, o: any) => sum + Number(o.remaining_amount || 0), 0),
        totalOrders: orders.length,
        totalAmount: activeOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0),
      };
      
      setOrderSummary(summary);
      setProducts(productsData.filter((p: Product) => p.status === "ACTIVE") || []);
    } catch (error) {
      console.error("Data load error:", error);
      setUserOrders([]);
      setOrderSummary(null);
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

  // Handle debt payment
  const handlePayDebt = (orderId: number) => {
    setPaymentOrderId(orderId);
    setPaymentAmount("");
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!paymentOrderId || !paymentAmount) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Düzgün məbləğ daxil edin");
      return;
    }

    const order = userOrders.find((o: any) => o.id === paymentOrderId);
    if (!order) return;

    const remaining = Number(order.remaining_amount || order.remainingAmount || 0);
    if (amount > remaining) {
      alert(`Maksimum ${remaining.toFixed(2)} AZN ödəniş edilə bilər`);
      return;
    }

    setPaymentProcessing(true);
    try {
      await orderApi.addPayment(paymentOrderId, amount, "CASH", "Müştəri ödənişi");
      alert("Ödəniş uğurla qeydə alındı!");
      setShowPaymentModal(false);
      loadData(); // Refresh data
    } catch (error: any) {
      alert(error.message || "Ödəniş xətası");
    } finally {
      setPaymentProcessing(false);
    }
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

  // Stats are now calculated in loadData and stored in orderSummary

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
            { id: "store", label: "Mağazam", icon: Store, href: "/dashboard/store" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => tab.href ? router.push(tab.href) : setActiveTab(tab.id as any)}
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
                  <div className="w-12 h-12 bg-[#3B82F6]/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-[#3B82F6]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Bu Ay Sifariş</p>
                    <p className="text-2xl font-bold text-[#3B82F6]">{orderSummary?.monthOrderCount || 0}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#16A34A]/10 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-[#16A34A]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Ödənilib</p>
                    <p className="text-2xl font-bold text-[#16A34A]">{(orderSummary?.totalPaid || 0).toFixed(2)} AZN</p>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#EF4444]/10 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-[#EF4444]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Qalan Borc</p>
                    <p className="text-2xl font-bold text-[#EF4444]">{(orderSummary?.totalDebt || 0).toFixed(2)} AZN</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Monthly Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                <p className="text-xs text-blue-600 font-medium">Bu Gün Sifariş</p>
                <p className="text-3xl font-bold text-blue-700">{orderSummary?.todayOrderCount || 0}</p>
                <p className="text-xs text-blue-500 mt-1">{(orderSummary?.todayOrderAmount || 0).toFixed(2)} AZN</p>
              </Card>
              
              <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                <p className="text-xs text-purple-600 font-medium">Bu Ay Məbləğ</p>
                <p className="text-3xl font-bold text-purple-700">{(orderSummary?.monthOrderAmount || 0).toFixed(2)} AZN</p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                <p className="text-xs text-green-600 font-medium">Ümumi Ödəniş</p>
                <p className="text-3xl font-bold text-green-700">{(orderSummary?.totalPaid || 0).toFixed(2)} AZN</p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
                <p className="text-xs text-red-600 font-medium">Ümumi Borc</p>
                <p className="text-3xl font-bold text-red-700">{(orderSummary?.totalDebt || 0).toFixed(2)} AZN</p>
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
                        <p className="font-bold text-[#D90429] text-lg">#{order.order_number || order.orderNumber}</p>
                        <p className="text-sm text-[#6B7280]">
                          {new Date(order.created_at || order.createdAt).toLocaleString("az-AZ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={order.status?.toLowerCase() || "pending"} />
                        {/* Payment Status Badge */}
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          order.payment_status === "PAID" ? "bg-green-100 text-green-700" :
                          order.payment_status === "PARTIAL" ? "bg-orange-100 text-orange-700" :
                          order.payment_status === "CANCELLED" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {order.payment_status === "PAID" ? "Ödənilib" :
                           order.payment_status === "PARTIAL" ? "Qismən" :
                           order.payment_status === "CANCELLED" ? "Ləğv" : "Gözləyir"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-sm bg-[#F9FAFB] rounded-lg p-3">
                          <span className="text-[#1F2937]">{item.product_name || item.productName}</span>
                          <span className="text-[#6B7280]">
                            {item.width && item.height ? `${item.width}×${item.height}m` : ""} 
                            {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                          </span>
                          <span className="font-semibold text-[#1F2937]">{(item.line_total || item.lineTotal)?.toFixed(2)} AZN</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                      <div>
                        <p className="text-sm text-[#6B7280]">Müştəri</p>
                        <p className="font-semibold text-[#1F2937]">{order.customer_name || order.customerName}</p>
                        {order.customer_phone && <p className="text-sm text-[#6B7280]">{order.customer_phone}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[#6B7280]">Ümumi</p>
                        <p className="text-xl font-bold text-[#D90429]">{(order.total_amount || order.totalAmount || 0).toFixed(2)} AZN</p>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-xs text-[#6B7280]">Ödənilib</p>
                          <p className="text-lg font-bold text-green-600">{(order.paid_amount || order.paidAmount || 0).toFixed(2)} AZN</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <p className="text-xs text-[#6B7280]">Qalan</p>
                          <p className="text-lg font-bold text-red-600">{(order.remaining_amount || order.remainingAmount || 0).toFixed(2)} AZN</p>
                        </div>
                        {/* Pay Button */}
                        {(order.payment_status !== "PAID" && order.payment_status !== "CANCELLED" && Number(order.remaining_amount || order.remainingAmount || 0) > 0) && (
                          <button
                            onClick={() => handlePayDebt(order.id)}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#16A34A] to-[#15803D] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition-all"
                          >
                            <DollarSign className="w-5 h-5" />
                            <span>Ödə</span>
                          </button>
                        )}
                        {order.payment_status === "PAID" && (
                          <div className="flex items-center justify-center gap-2 p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-semibold text-green-700">Tam Ödənilib</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#1F2937]">Ödəniş Et</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {(() => {
                const order = userOrders.find((o: any) => o.id === paymentOrderId);
                if (!order) return null;
                return (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Sifariş:</span>
                        <span className="font-bold text-[#D90429]">#{(order as any).order_number || (order as any).orderNumber}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Ümumi məbləğ:</span>
                        <span className="font-bold">{(order.total_amount || order.totalAmount || 0).toFixed(2)} AZN</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Ödənilib:</span>
                        <span className="font-semibold text-green-600">{(order.paid_amount || order.paidAmount || 0).toFixed(2)} AZN</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Qalan borc:</span>
                        <span className="font-bold text-red-600">{(order.remaining_amount || order.remainingAmount || 0).toFixed(2)} AZN</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ödəniş məbləği (AZN)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D90429]/20 focus:border-[#D90429]"
                      />
                    </div>

                    {/* Quick amounts */}
                    <div className="grid grid-cols-3 gap-2">
                      {[10, 20, 50].map((amt) => {
                        const order = userOrders.find((o: any) => o.id === paymentOrderId);
                        const maxAmt = order ? Number(order.remaining_amount || order.remainingAmount || 0) : 0;
                        if (amt > maxAmt) return null;
                        return (
                          <button
                            key={amt}
                            onClick={() => setPaymentAmount(amt.toString())}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                          >
                            {amt} AZN
                          </button>
                        );
                      })}
                      <button
                        onClick={() => {
                          const order = userOrders.find((o: any) => o.id === paymentOrderId);
                          if (order) {
                            setPaymentAmount((order.remaining_amount || order.remainingAmount || 0).toString());
                          }
                        }}
                        className="px-4 py-2 bg-[#D90429]/10 hover:bg-[#D90429]/20 rounded-lg text-sm font-medium text-[#D90429] transition-colors"
                      >
                        Tam Borc
                      </button>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="ghost"
                        onClick={() => setShowPaymentModal(false)}
                        className="flex-1"
                      >
                        Ləğv
                      </Button>
                      <Button
                        onClick={handlePaymentSubmit}
                        disabled={paymentProcessing || !paymentAmount}
                        className="flex-1 bg-gradient-to-r from-[#16A34A] to-[#15803D] hover:shadow-lg hover:shadow-green-500/30"
                        icon={paymentProcessing ? <RefreshCw className="animate-spin w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                      >
                        {paymentProcessing ? "Gözləyin..." : "Ödəniş Et"}
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
