"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  auth,
  vendorStores,
  vendorProducts,
  vendorOrders,
  vendorWithdrawals,
  calculateCommission,
  type User,
  type VendorStore,
  type VendorProduct,
  type VendorOrder,
  type VendorWithdrawal,
} from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ImageUpload, MultiImageUpload } from "@/components/ui/ImageUpload";
import {
  Store,
  Package,
  ShoppingBag,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Eye,
  ArrowRight,
  Check,
  X,
  Wallet,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default function VendorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<VendorStore | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [withdrawals, setWithdrawals] = useState<VendorWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "withdrawals">("overview");
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showWithdrawal, setShowWithdrawal] = useState(false);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);

    // Check if user has a store
    const userStore = vendorStores.getByVendorId(currentUser.id);
    if (userStore) {
      setStore(userStore);
      setProducts(vendorProducts.getByVendorId(currentUser.id));
      setOrders(vendorOrders.getByVendorId(currentUser.id));
      setWithdrawals(vendorWithdrawals.getByVendorId(currentUser.id));
    } else if (currentUser.isVendor && currentUser.storeId) {
      const storeById = vendorStores.getById(currentUser.storeId);
      if (storeById) {
        setStore(storeById);
        setProducts(vendorProducts.getByVendorId(currentUser.id));
        setOrders(vendorOrders.getByVendorId(currentUser.id));
        setWithdrawals(vendorWithdrawals.getByVendorId(currentUser.id));
      }
    }
    setLoading(false);
  }, [router]);

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.vendorTotal, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const totalProducts = products.length;
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending").reduce((sum, w) => sum + w.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D90429]" />
      </div>
    );
  }

  if (!user) return null;

  // No store - show create store form
  if (!store) {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <Header />
        <main className="pt-24 pb-8">
          <div className="max-w-2xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="w-20 h-20 bg-[#D90429]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="w-10 h-10 text-[#D90429]" />
              </div>
              <h1 className="text-2xl font-bold">Mağaza Açın</h1>
              <p className="text-gray-600 mt-2">
                Öz mağazanızı yaradın və məhsullarınızı satmağa başlayın
              </p>
            </motion.div>

            <CreateStoreForm
              userId={user.id}
              onSuccess={(newStore) => {
                setStore(newStore);
                // Update user
                const updatedUser = { ...user, isVendor: true, storeId: newStore.id };
                localStorage.setItem("decor_current_user", JSON.stringify(updatedUser));
              }}
            />
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Header />

      <main className="pt-20 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Store Header */}
          <div className="bg-gradient-to-r from-[#D90429] to-[#EF476F] rounded-2xl p-6 text-white mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">{store.name}</h1>
                <p className="text-white/80 mt-1">{store.description}</p>
                <div className="flex gap-4 mt-2 text-sm text-white/70">
                  <span>{store.totalSales} satış</span>
                  <span>{store.rating.toFixed(1)} reytinq</span>
                </div>
              </div>
              <Link href={`/store/${store.id}`} target="_blank">
                <Button variant="secondary" icon={<Eye className="w-4 h-4" />}>
                  Mağazaya bax
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Ümumi Gəlir"
              value={`${totalRevenue.toFixed(2)} AZN`}
              icon={DollarSign}
              color="emerald"
            />
            <StatCard
              title="Gözləyən Sifariş"
              value={pendingOrders.toString()}
              icon={ShoppingBag}
              color="amber"
            />
            <StatCard
              title="Məhsul Sayı"
              value={totalProducts.toString()}
              icon={Package}
              color="blue"
            />
            <StatCard
              title="Balans"
              value={`${(user.vendorBalance - pendingWithdrawals).toFixed(2)} AZN`}
              icon={Wallet}
              color="purple"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: "overview", label: "Ümumi", icon: TrendingUp },
              { id: "products", label: "Məhsullar", icon: Package },
              { id: "orders", label: "Sifarişlər", icon: ShoppingBag },
              { id: "withdrawals", label: "Çıxarış", icon: Wallet },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-[#D90429] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <OverviewTab
              orders={orders}
              products={products}
              store={store}
              user={user}
            />
          )}
          {activeTab === "products" && (
            <ProductsTab
              products={products}
              storeId={store.id}
              vendorId={user.id}
              onUpdate={() => setProducts(vendorProducts.getByVendorId(user.id))}
            />
          )}
          {activeTab === "orders" && (
            <OrdersTab
              orders={orders}
              onUpdate={() => setOrders(vendorOrders.getByVendorId(user.id))}
            />
          )}
          {activeTab === "withdrawals" && (
            <WithdrawalsTab
              withdrawals={withdrawals}
              user={user}
              onUpdate={() => setWithdrawals(vendorWithdrawals.getByVendorId(user.id))}
            />
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );
}

// Create Store Form
function CreateStoreForm({
  userId,
  onSuccess,
}: {
  userId: string;
  onSuccess: (store: VendorStore) => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    category: [] as string[],
    logo: undefined as string | undefined,
    banner: undefined as string | undefined,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newStore = vendorStores.create({
      vendorId: userId,
      name: formData.name,
      description: formData.description,
      address: formData.address,
      phone: formData.phone,
      email: formData.email,
      category: formData.category,
      logo: formData.logo,
      banner: formData.banner,
      isActive: true,
      isApproved: true,
      highlightTier: "standard",
      commissionRate: 0.05, // 5%
      totalOrderAmount: 0,
      totalBonusEarned: 0,
    });

    onSuccess(newStore);
    setLoading(false);
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Logo Upload */}
        <ImageUpload
          label="Mağaza Logosu"
          value={formData.logo}
          onChange={(logo) => setFormData({ ...formData, logo })}
          placeholder="Logo yüklə"
          aspectRatio="square"
          className="w-32 mx-auto"
        />

        {/* Banner Upload */}
        <ImageUpload
          label="Mağaza Banneri"
          value={formData.banner}
          onChange={(banner) => setFormData({ ...formData, banner })}
          placeholder="Banner yüklə"
          aspectRatio="banner"
        />

        <Input
          label="Mağaza Adı"
          value={formData.name}
          onChange={(value) => setFormData({ ...formData, name: value })}
          required
        />
        <div>
          <label className="block text-sm font-medium mb-2">Açıqlama</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D90429] focus:border-transparent"
            rows={3}
            required
          />
        </div>
        <Input
          label="Ünvan"
          value={formData.address}
          onChange={(value) => setFormData({ ...formData, address: value })}
          required
        />
        <Input
          label="Telefon"
          value={formData.phone}
          onChange={(value) => setFormData({ ...formData, phone: value })}
          required
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(value) => setFormData({ ...formData, email: value })}
          required
        />
        <Button type="submit" className="w-full" loading={loading}>
          Mağaza Yarat
        </Button>
      </form>
    </Card>
  );
}

// Overview Tab
function OverviewTab({
  orders,
  products,
  store,
  user,
}: {
  orders: VendorOrder[];
  products: VendorProduct[];
  store: VendorStore;
  user: User;
}) {
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold mb-4">Son Sifarişlər</h3>
          {recentOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Hələ sifariş yoxdur</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{order.orderId}</p>
                    <p className="text-sm text-gray-500">{order.items.length} məhsul</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{order.subtotal.toFixed(2)} AZN</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        order.status === "pending"
                          ? "bg-amber-100 text-amber-600"
                          : order.status === "delivered"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-4">Populyar Məhsullar</h3>
          {products.slice(0, 5).length === 0 ? (
            <p className="text-gray-500 text-center py-4">Hələ məhsul yoxdur</p>
          ) : (
            <div className="space-y-3">
              {products.slice(0, 5).map((product) => (
                <div key={product.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.price} AZN/{product.unit}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      product.stock > 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                    }`}
                  >
                    Stok: {product.stock}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// Products Tab
function ProductsTab({
  products,
  storeId,
  vendorId,
  onUpdate,
}: {
  products: VendorProduct[];
  storeId: string;
  vendorId: string;
  onUpdate: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);

  const handleAddProduct = (productData: Omit<VendorProduct, "id" | "createdAt" | "updatedAt">) => {
    vendorProducts.create(productData);
    setShowAdd(false);
    onUpdate();
  };

  const handleDelete = (id: string) => {
    if (confirm("Məhsulu silmək istədiyinizə əminsiniz?")) {
      vendorProducts.delete(id);
      onUpdate();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Məhsullarım ({products.length})</h2>
        <Button onClick={() => setShowAdd(true)} icon={<Plus className="w-4 h-4" />}>
          Yeni Məhsul
        </Button>
      </div>

      {showAdd && (
        <AddProductForm
          storeId={storeId}
          vendorId={vendorId}
          onSubmit={handleAddProduct}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {products.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Hələ məhsul əlavə etməmisiniz</p>
          <Button className="mt-4" onClick={() => setShowAdd(true)}>
            İlk Məhsulu Əlavə Et
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="p-4">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">{product.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                      <p className="text-[#D90429] font-bold mt-1">
                        {(product.price || 0).toFixed(2)} AZN/{product.unit}
                      </p>
                      <p className={`text-sm ${product.stock > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        Stok: {product.stock}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Add Product Form
function AddProductForm({
  storeId,
  vendorId,
  onSubmit,
  onCancel,
}: {
  storeId: string;
  vendorId: string;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Vinil",
    price: "",
    unit: "m²" as "m²" | "ədəd" | "metr",
    stock: "",
    images: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const price = parseFloat(formData.price);
    const stock = parseInt(formData.stock);
    
    if (isNaN(price) || price <= 0) {
      alert("Zəhmət olmasa düzgün qiymət daxil edin");
      return;
    }
    
    if (isNaN(stock) || stock < 0) {
      alert("Zəhmət olmasa düzgün stok miqdarı daxil edin");
      return;
    }
    
    onSubmit({
      vendorId,
      storeId,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      price: price,
      unit: formData.unit,
      stock: stock,
      images: formData.images,
      isActive: true,
    });
  };

  return (
    <Card className="p-6 mb-6">
      <h3 className="font-bold mb-4">Yeni Məhsul</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Məhsul Adı"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            required
          />
          <Input
            label="Kateqoriya"
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Açıqlama</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D90429] focus:border-transparent"
            rows={2}
            required
          />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Input
            label="Qiymət (AZN)"
            type="number"
            value={formData.price}
            onChange={(value) => setFormData({ ...formData, price: value })}
            required
          />
          <div>
            <label className="block text-sm font-medium mb-2">Vahid</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D90429] focus:border-transparent"
            >
              <option value="m²">m²</option>
              <option value="ədəd">ədəd</option>
              <option value="metr">metr</option>
            </select>
          </div>
          <Input
            label="Stok"
            type="number"
            value={formData.stock}
            onChange={(value) => setFormData({ ...formData, stock: value })}
            required
          />
        </div>

        {/* Product Images */}
        <MultiImageUpload
          label="Məhsul Şəkilləri"
          values={formData.images}
          onChange={(images) => setFormData({ ...formData, images })}
          maxImages={5}
        />
        <div className="flex gap-2">
          <Button type="submit">Yadda Saxla</Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Ləğv Et
          </Button>
        </div>
      </form>
    </Card>
  );
}

// Orders Tab
function OrdersTab({
  orders,
  onUpdate,
}: {
  orders: VendorOrder[];
  onUpdate: () => void;
}) {
  const updateStatus = (orderId: string, status: VendorOrder["status"]) => {
    vendorOrders.updateStatus(orderId, status);
    onUpdate();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Sifarişlər ({orders.length})</h2>
      {orders.length === 0 ? (
        <Card className="p-8 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Hələ sifariş yoxdur</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{order.orderId}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        order.status === "pending"
                          ? "bg-amber-100 text-amber-600"
                          : order.status === "delivered"
                          ? "bg-emerald-100 text-emerald-600"
                          : order.status === "cancelled"
                          ? "bg-red-100 text-red-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {order.items.length} məhsul • {new Date(order.createdAt).toLocaleDateString("az-AZ")}
                  </p>
                  <div className="mt-2 space-y-1">
                    {order.items.map((item, idx) => (
                      <p key={idx} className="text-sm">
                        {item.productName} x {item.quantity}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{order.subtotal.toFixed(2)} AZN</p>
                  <p className="text-sm text-gray-500">
                    Komissiya: {order.commission.toFixed(2)} AZN
                  </p>
                  <p className="text-sm font-medium text-emerald-600">
                    Sizə: {order.vendorTotal.toFixed(2)} AZN
                  </p>
                  {order.status === "pending" && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => updateStatus(order.id, "confirmed")}
                      >
                        Təsdiqlə
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateStatus(order.id, "cancelled")}
                      >
                        Ləğv Et
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Withdrawals Tab
function WithdrawalsTab({
  withdrawals,
  user,
  onUpdate,
}: {
  withdrawals: VendorWithdrawal[];
  user: User;
  onUpdate: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"bank" | "cash">("bank");
  const [accountInfo, setAccountInfo] = useState("");

  const availableBalance = user.vendorBalance - withdrawals
    .filter((w) => w.status === "pending" || w.status === "approved")
    .reduce((sum, w) => sum + w.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (numAmount > availableBalance) {
      alert("Kifayət qədər balans yoxdur!");
      return;
    }
    vendorWithdrawals.create({
      vendorId: user.id,
      amount: numAmount,
      status: "pending",
      method,
      accountInfo,
    });
    setShowForm(false);
    setAmount("");
    setAccountInfo("");
    onUpdate();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">Çıxarışlar</h2>
          <p className="text-sm text-gray-500">
            Mövcud balans: <span className="font-bold text-emerald-600">{availableBalance.toFixed(2)} AZN</span>
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          disabled={availableBalance <= 0}
          icon={<Wallet className="w-4 h-4" />}
        >
          Çıxarış Et
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-6">
          <h3 className="font-bold mb-4">Yeni Çıxarış</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Məbləğ (AZN)"
              type="number"
              value={amount}
              onChange={(value) => {
                const val = parseFloat(value);
                if (val <= availableBalance) setAmount(value);
              }}
              required
            />
            <div>
              <label className="block text-sm font-medium mb-2">Üsul</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="bank"
                    checked={method === "bank"}
                    onChange={(e) => setMethod(e.target.value as any)}
                  />
                  Bank köçürməsi
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="cash"
                    checked={method === "cash"}
                    onChange={(e) => setMethod(e.target.value as any)}
                  />
                  Nağd
                </label>
              </div>
            </div>
            <Input
              label={method === "bank" ? "Bank Hesabı (IBAN)" : "Əlaqə nömrəsi"}
              value={accountInfo}
              onChange={(value) => setAccountInfo(value)}
              required
            />
            <div className="flex gap-2">
              <Button type="submit">Göndər</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Ləğv Et
              </Button>
            </div>
          </form>
        </Card>
      )}

      {withdrawals.length === 0 ? (
        <Card className="p-8 text-center">
          <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Hələ çıxarış yoxdur</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((w) => (
            <Card key={w.id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">{w.amount.toFixed(2)} AZN</p>
                  <p className="text-sm text-gray-500">
                    {w.method === "bank" ? "Bank köçürməsi" : "Nağd"} • {new Date(w.requestedAt).toLocaleDateString("az-AZ")}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    w.status === "pending"
                      ? "bg-amber-100 text-amber-600"
                      : w.status === "approved" || w.status === "completed"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {w.status === "pending"
                    ? "Gözləyir"
                    : w.status === "approved"
                    ? "Təsdiqləndi"
                    : w.status === "completed"
                    ? "Tamamlandı"
                    : "Rədd edildi"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
