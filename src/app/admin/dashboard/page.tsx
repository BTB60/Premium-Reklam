"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { orders, notifications, settings, tasks, products, finance, inventory, workerTasks, messages, playNotificationSound, type User, type Order, type Notification, type SystemSettings, type Task, type Product, type ProductCategory, type FinancialTransaction, type Material, type WorkerTask } from "@/lib/db";
import { authApi } from "@/lib/authApi";
import { getOrderTotal, formatAZN } from "@/lib/orderHelpers";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { ProductsManager } from "@/components/admin/ProductsManager";
import { FinanceDashboard } from "@/components/admin/FinanceDashboard";
import { InventoryManager } from "@/components/admin/InventoryManager";
import { WorkerTasksManager } from "@/components/admin/WorkerTasksManager";
import { SupportManager } from "@/components/admin/SupportManager";
import { 
  Shield, 
  Users, 
  Package, 
  TrendingUp, 
  LogOut,
  Bell,
  Trash2,
  CheckCircle,
  Search,
  Plus,
  Edit,
  Eye,
  X,
  Save,
  UserCircle,
  ShoppingBag,
  Award,
  Phone,
  Mail,
  Lock,
  Settings,
  ClipboardList,
  Calendar,
  CheckSquare,
  DollarSign,
  Clock,
  BarChart3,
  Store,
  Wallet,
  Boxes,
  Headphones,
  Menu,
  ChevronLeft
} from "lucide-react";

interface EditingUser {
  id: string;
  fullName: string;
  username: string;
  phone?: string;
  email?: string;
  password: string;
  level: number;
  totalOrders: number;
  totalSales: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<ProductCategory[]>([]);
  const [allTransactions, setAllTransactions] = useState<FinancialTransaction[]>([]);
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [allWorkerTasks, setAllWorkerTasks] = useState<WorkerTask[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "orders" | "notifications" | "analytics" | "products" | "finance" | "inventory" | "workerTasks" | "support" | "settings" | "tasks" | "userDetail">("dashboard");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      router.push("/admin/login");
      return;
    }
    setUser(currentUser as any);
    loadData();
    setLoading(false);
  }, [router]);

  // Check for new notifications every 5 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      const notifs = notifications.getAll();
      
      // If there are new notifications, play sound
      if (notifs.length > lastNotificationCount) {
        playNotificationSound();
        setLastNotificationCount(notifs.length);
      }
      
      setAllNotifications(notifs);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [user, lastNotificationCount]);

  const loadData = async () => {
    const users = await authApi.getAllUsers();
    setAllUsers(users as any);
    setAllOrders(orders.getAll());
    const notifs = notifications.getAll();
    setAllNotifications(notifs);
    setLastNotificationCount(notifs.length);
    setAllProducts(products.getAll());
    setAllCategories(products.getCategories());
    setAllTransactions(finance.getAll());
    setAllMaterials(inventory.getAll());
    setAllWorkerTasks(workerTasks.getAll());
  };

  const handleLogout = () => {
    authApi.logout();
    router.push("/admin/login");
  };

  const deleteUser = async (userId: string) => {
    if (confirm("İstifadəçini silmək istədiyinizə əminsiniz?")) {
      // TODO: Implement delete user API
      const users = (await authApi.getAllUsers()).filter((u: any) => u.id !== userId);
      // localStorage.setItem("decor_users", JSON.stringify(users));
      // Also delete user's orders
      const userOrders = orders.getAll().filter(o => o.userId !== userId);
      localStorage.setItem("decor_orders", JSON.stringify(userOrders));
      loadData();
    }
  };

  const viewUserDetail = (user: User) => {
    setSelectedUser(user);
    setEditingUser({
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      phone: user.phone || "",
      email: user.email,
      password: user.password,
      level: user.level,
      totalOrders: user.totalOrders || 0,
      totalSales: user.totalSales,
    });
    setActiveTab("userDetail");
  };

  const updateUser = async () => {
    if (!editingUser) return;
    
    // TODO: Implement update user API
    const allUsers = await authApi.getAllUsers();
    const userIndex = allUsers.findIndex((u: any) => u.id === editingUser.id);
    
    if (userIndex !== -1) {
      allUsers[userIndex] = {
        ...allUsers[userIndex],
        full_name: editingUser.fullName,
        username: editingUser.username,
        phone: editingUser.phone || "",
        email: editingUser.email || "",
        password_hash: editingUser.password,
        level: editingUser.level,
        total_orders: editingUser.totalOrders,
      };
      // localStorage.setItem("decor_users", JSON.stringify(allUsers));
      loadData();
      setEditingUser(null);
      alert("İstifadəçi məlumatları yeniləndi!");
    }
  };

  const createNotificationForUser = (userId: string, title: string, message: string) => {
    notifications.create({
      userId,
      title,
      message,
      type: "system"
    });
    loadData();
  };

  const getStatusMessage = (status: Order["status"]) => {
    const messages: Record<Order["status"], { title: string; message: string }> = {
      pending: { title: "Sifariş gözləyir", message: "Sifarişiniz admin təsdiqini gözləyir" },
      approved: { title: "Sifariş təsdiqləndi", message: "Sifarişiniz təsdiqləndi və işə başlandı" },
      confirmed: { title: "Sifariş təsdiqləndi", message: "Sifarişiniz təsdiqləndi" },
      design: { title: "Dizayn mərhələsində", message: "Sifarişiniz hazırda dizayn mərhələsindədir" },
      printing: { title: "Çap edilir", message: "Sifarişiniz çap olunur" },
      production: { title: "İstehsalatda", message: "Sifarişiniz istehsalat mərhələsindədir" },
      ready: { title: "Sifariş hazırdır", message: "Sifarişiniz hazırdır, çatdırılma gözlənilir" },
      delivering: { title: "Çatdırılır", message: "Sifarişiniz çatdırılma mərhələsindədir" },
      completed: { title: "Sifariş tamamlandı", message: "Sifarişiniz uğurla tamamlandı" },
      cancelled: { title: "Sifariş ləğv edildi", message: "Sifarişiniz ləğv edildi" },
    };
    return messages[status];
  };

  const updateOrderStatus = (orderId: string, status: Order["status"]) => {
    const allOrders = orders.getAll();
    const orderIndex = allOrders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      const oldStatus = allOrders[orderIndex].status;
      allOrders[orderIndex].status = status;
      localStorage.setItem("decor_orders", JSON.stringify(allOrders));
      
      // Get status-specific message
      const statusMsg = getStatusMessage(status);
      
      // Create notification for user with sound trigger
      notifications.create({
        userId: allOrders[orderIndex].userId,
        title: statusMsg.title,
        message: statusMsg.message,
        type: "order_status"
      });
      
      // Play notification sound (for admin feedback)
      playNotificationSound();
      
      loadData();
    }
  };

  const deleteOrder = (orderId: string) => {
    if (confirm("Sifarişi silmək istədiyinizə əminsiniz?")) {
      const allOrders = orders.getAll().filter(o => o.id !== orderId);
      localStorage.setItem("decor_orders", JSON.stringify(allOrders));
      loadData();
    }
  };

  const deleteNotification = (id: string) => {
    notifications.delete(id);
    loadData();
  };

  const stats = {
    totalUsers: allUsers.length,
    totalOrders: allOrders.length,
    pendingOrders: allOrders.filter(o => o.status === "pending").length,
    totalRevenue: allOrders.reduce((sum, o) => sum + ((o as any).totalAmount || 0), 0),
    decorators: allUsers.filter(u => u.role === "DECORATOR").length,
    admins: allUsers.filter(u => u.role === "ADMIN").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1F2937] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D90429]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Admin Header */}
      <header className="bg-[#1F2937] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Shield className="w-6 h-6 text-[#D90429]" />
              <span className="font-bold text-lg">Admin Panel</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm hidden sm:block">{user.fullName}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} icon={<LogOut className="w-4 h-4" />}>
                <span className="hidden sm:inline">Çıxış</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white min-h-screen border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}>
          <div className="flex items-center justify-between p-4 lg:hidden">
            <span className="font-bold text-lg">Menyu</span>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          <nav className="p-4 space-y-2">
            {[
              { id: "dashboard", label: "Dashboard", icon: TrendingUp },
              { id: "users", label: "İstifadəçilər", icon: Users },
              { id: "orders", label: "Sifarişlər", icon: Package },
              { id: "notifications", label: "Bildirişlər", icon: Bell },
              { id: "analytics", label: "Analytics", icon: BarChart3 },
              { id: "products", label: "Məhsullar", icon: Store },
              { id: "finance", label: "Maliyyə", icon: Wallet },
              { id: "inventory", label: "Anbar", icon: Boxes },
              { id: "workerTasks", label: "İşçi Tapşırıqları", icon: ClipboardList },
              { id: "support", label: "Dəstək", icon: Headphones },
              { id: "tasks", label: "Tapşırıqlar", icon: CheckSquare },
              { id: "settings", label: "Sistem Ayarları", icon: Settings },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? "bg-[#D90429] text-white"
                    : "text-[#6B7280] hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {activeTab === "dashboard" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-2xl font-bold text-[#1F2937] mb-6">Dashboard</h1>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#6B7280] text-sm">Ümumi İstifadəçi</p>
                      <p className="text-3xl font-bold text-[#1F2937]">{stats.totalUsers}</p>
                    </div>
                    <div className="w-12 h-12 bg-[#D90429]/10 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-[#D90429]" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#6B7280] text-sm">Ümumi Sifariş</p>
                      <p className="text-3xl font-bold text-[#1F2937]">{stats.totalOrders}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#6B7280] text-sm">Gözləyən Sifariş</p>
                      <p className="text-3xl font-bold text-[#1F2937]">{stats.pendingOrders}</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                      <StatusBadge status="pending" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#6B7280] text-sm">Ümumi Gəlir</p>
                      <p className="text-3xl font-bold text-[#1F2937]">{stats.totalRevenue.toFixed(0)} AZN</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-emerald-500" />
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-semibold text-[#1F2937] mb-4">İstifadəçi Rolleri</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Decorator</span>
                      <span className="font-semibold">{stats.decorators}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Admin</span>
                      <span className="font-semibold">{stats.admins}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-[#1F2937] mb-4">Son Sifarişlər</h3>
                  <div className="space-y-3">
                    {allOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between">
                        <span className="text-sm">{(order.orderNumber || order.id || '').slice(0, 8)}...</span>
                        <StatusBadge status={order.status} />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "users" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-[#1F2937]">İstifadəçilər</h1>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Axtar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                    />
                  </div>
                  <p className="text-[#6B7280]">Ümumi: {allUsers.length}</p>
                </div>
              </div>

              <Card className="overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Ad</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">İstifadəçi adı</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Telefon</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Rol</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Level</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Sifariş</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Satış</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Əməliyyat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers
                      .filter(u => 
                        (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (u.phone || '').includes(searchQuery)
                      )
                      .map((u) => (
                      <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{u.fullName}</td>
                        <td className="py-3 px-4 text-[#6B7280]">{u.username}</td>
                        <td className="py-3 px-4 text-[#6B7280]">{u.phone || "-"}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            u.role === "ADMIN" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1">
                            <Award className="w-4 h-4 text-amber-500" />
                            {u.level}
                          </span>
                        </td>
                        <td className="py-3 px-4">{u.totalOrders || 0}</td>
                        <td className="py-3 px-4">{u.totalSales} AZN</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => viewUserDetail(u)}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                              title="Ətraflı bax"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {u.role !== "ADMIN" && (
                              <button
                                onClick={() => deleteUser(u.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </motion.div>
          )}

          {activeTab === "userDetail" && selectedUser && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setActiveTab("users")}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-[#1F2937]">İstifadəçi Detalları</h1>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* User Info Card */}
                <Card className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-[#D90429]/10 rounded-full flex items-center justify-center">
                      <UserCircle className="w-8 h-8 text-[#D90429]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#1F2937]">{selectedUser.fullName}</h2>
                      <p className="text-[#6B7280]">@{selectedUser.username}</p>
                    </div>
                  </div>

                  {editingUser ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#6B7280] mb-1">Ad Soyad</label>
                        <input
                          type="text"
                          value={editingUser.fullName}
                          onChange={(e) => setEditingUser({...editingUser, fullName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#6B7280] mb-1">İstifadəçi adı</label>
                        <input
                          type="text"
                          value={editingUser.username}
                          onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#6B7280] mb-1">Telefon</label>
                        <input
                          type="text"
                          value={editingUser.phone}
                          onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#6B7280] mb-1">Email</label>
                        <input
                          type="email"
                          value={editingUser.email || ""}
                          onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#6B7280] mb-1">Şifrə</label>
                        <input
                          type="text"
                          value={editingUser.password}
                          onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#6B7280] mb-1">Level</label>
                          <input
                            type="number"
                            value={editingUser.level}
                            onChange={(e) => setEditingUser({...editingUser, level: parseInt(e.target.value) || 1})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#6B7280] mb-1">Sifariş</label>
                          <input
                            type="number"
                            value={editingUser.totalOrders}
                            onChange={(e) => setEditingUser({...editingUser, totalOrders: parseInt(e.target.value) || 0})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#6B7280] mb-1">Satış (AZN)</label>
                          <input
                            type="number"
                            value={editingUser.totalSales}
                            onChange={(e) => setEditingUser({...editingUser, totalSales: parseInt(e.target.value) || 0})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button onClick={updateUser} icon={<Save className="w-4 h-4" />}>
                          Yadda saxla
                        </Button>
                        <Button variant="ghost" onClick={() => setEditingUser(null)}>
                          Ləğv et
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-[#6B7280]" />
                        <span>{selectedUser.phone || "-"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-[#6B7280]" />
                        <span>{selectedUser.email || "-"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-[#6B7280]" />
                        <span className="font-mono text-sm">{selectedUser.password}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-amber-500" />
                        <span>Level {selectedUser.level}</span>
                      </div>
                      <div className="pt-4">
                        <Button onClick={() => setEditingUser({
                          id: selectedUser.id,
                          fullName: selectedUser.fullName,
                          username: selectedUser.username,
                          phone: selectedUser.phone || "",
                          email: selectedUser.email,
                          password: selectedUser.password,
                          level: selectedUser.level,
                          totalOrders: selectedUser.totalOrders,
                          totalSales: selectedUser.totalSales,
                        })} icon={<Edit className="w-4 h-4" />}>
                          Məlumatları düzənlə
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>

                {/* User Stats */}
                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="font-semibold text-[#1F2937] mb-4 flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-[#D90429]" />
                      Statistika
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-[#6B7280] text-sm">Ümumi sifariş</p>
                        <p className="text-2xl font-bold text-[#1F2937]">{selectedUser.totalOrders}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-[#6B7280] text-sm">Ümumi satış</p>
                        <p className="text-2xl font-bold text-[#1F2937]">{selectedUser.totalSales} AZN</p>
                      </div>
                    </div>
                  </Card>

                  {/* User Orders */}
                  <Card className="p-6">
                    <h3 className="font-semibold text-[#1F2937] mb-4">İstifadəçinin sifarişləri</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {allOrders.filter(o => o.userId === selectedUser.id).length === 0 ? (
                        <p className="text-[#6B7280] text-center py-4">Sifariş yoxdur</p>
                      ) : (
                        allOrders
                          .filter(o => o.userId === selectedUser.id)
                          .map(order => (
                            <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{(order.orderNumber || order.id || '').slice(0, 8)}...</p>
                                <p className="text-xs text-[#6B7280]">{order.totalAmount?.toFixed(2)} AZN</p>
                              </div>
                              <StatusBadge status={order.status} />
                            </div>
                          ))
                      )}
                    </div>
                  </Card>

                  {/* Send Notification */}
                  <Card className="p-6">
                    <h3 className="font-semibold text-[#1F2937] mb-4">Bildiriş göndər</h3>
                    <SendNotificationForm 
                      userId={selectedUser.id} 
                      onSend={(title, message) => {
                        createNotificationForUser(selectedUser.id, title, message);
                        alert("Bildiriş göndərildi!");
                      }}
                    />
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "orders" && (
            <AdminOrdersHistory 
              allOrders={allOrders}
              allUsers={allUsers}
              updateOrderStatus={updateOrderStatus}
              deleteOrder={deleteOrder}
              viewUserDetail={viewUserDetail}
            />
          )}

          {activeTab === "notifications" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-[#1F2937]">Bildirişlər</h1>
                <p className="text-[#6B7280]">Ümumi: {allNotifications.length}</p>
              </div>

              <div className="space-y-3">
                {allNotifications.map((notification, index) => (
                  <Card key={`${notification.id}-${index}`} className={`p-4 ${!notification.isRead ? "bg-blue-50" : ""}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-[#1F2937]">{notification.title}</p>
                        <p className="text-sm text-[#6B7280]">{notification.message}</p>
                        <p className="text-xs text-[#9CA3AF] mt-1">
                          {new Date(notification.createdAt).toLocaleString("az-AZ")}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-[#1F2937]">Analytics Dashboard</h1>
              </div>
              <AnalyticsDashboard orders={allOrders} users={allUsers} />
            </motion.div>
          )}

          {activeTab === "products" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-[#1F2937]">Məhsul İdarəetməsi</h1>
              </div>
              <ProductsManager initialProducts={allProducts as any} initialCategories={allCategories as any} />
            </motion.div>
          )}

          {activeTab === "finance" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-[#1F2937]">Maliyyə İdarəetməsi</h1>
              </div>
              <FinanceDashboard transactions={allTransactions} />
            </motion.div>
          )}

          {activeTab === "inventory" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-[#1F2937]">Anbar İdarəetməsi</h1>
              </div>
              <InventoryManager materials={allMaterials} />
            </motion.div>
          )}

          {activeTab === "workerTasks" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-[#1F2937]">İşçi Tapşırıqları</h1>
              </div>
              <WorkerTasksManager tasks={allWorkerTasks} users={allUsers} />
            </motion.div>
          )}

          {activeTab === "support" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-[#1F2937]">Dəstək Mərkəzi</h1>
              </div>
              <SupportManager users={allUsers} />
            </motion.div>
          )}

          {activeTab === "settings" && <AdminSettings />}

          {activeTab === "tasks" && <AdminTasks allUsers={allUsers} />}
        </main>
      </div>
    </div>
  );
}

// Admin Orders History Component
function AdminOrdersHistory({ 
  allOrders, 
  allUsers, 
  updateOrderStatus, 
  deleteOrder,
  viewUserDetail 
}: { 
  allOrders: Order[]; 
  allUsers: User[]; 
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  deleteOrder: (id: string) => void;
  viewUserDetail: (user: User) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const filteredOrders = allOrders.filter(order => {
    // Search filter
    if (searchQuery) {
      const user = allUsers.find(u => u.id === order.userId);
      const matchesSearch = 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(i => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    
    // User filter
    if (userFilter !== "all" && order.userId !== userFilter) return false;
    
    // Date filter
    if (dateFilter !== "all") {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      const daysDiff = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (dateFilter === "today" && daysDiff > 1) return false;
      if (dateFilter === "week" && daysDiff > 7) return false;
      if (dateFilter === "month" && daysDiff > 30) return false;
    }
    
    return true;
  });

  const getStatusCount = (status: string) => allOrders.filter(o => o.status === status).length;
  
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Hamısı", value: allOrders.length, color: "bg-gray-100" },
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
      </div>

      {/* Revenue Summary */}
      <Card className="p-4 mb-6 bg-gradient-to-r from-[#D90429] to-[#EF476F] text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">Filtr üzrə ümumi gəlir</p>
            <p className="text-3xl font-bold">{totalRevenue.toFixed(2)} AZN</p>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm">Filtr üzrə sifariş</p>
            <p className="text-xl font-bold">{filteredOrders.length} ədəd</p>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Axtar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
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
          
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          >
            <option value="all">Bütün istifadəçilər</option>
            {allUsers.filter(u => u.role === "DECORATOR").map(u => (
              <option key={u.id} value={u.id}>{u.fullName} (@{u.username})</option>
            ))}
          </select>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          >
            <option value="all">Bütün tarixlər</option>
            <option value="today">Bu gün</option>
            <option value="week">Son 7 gün</option>
            <option value="month">Son 30 gün</option>
          </select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Sifariş ID</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">İstifadəçi</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Məhsullar</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Tarix</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Məbləğ</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#6B7280]">
                  Sifariş tapılmadı
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const orderUser = allUsers.find(u => u.id === order.userId);
                return (
                  <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium">#{order.orderNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => orderUser && viewUserDetail(orderUser)}
                        className="text-left hover:text-[#D90429]"
                      >
                        <p className="font-medium">{orderUser?.fullName || "Naməlum"}</p>
                        <p className="text-xs text-[#6B7280]">@{orderUser?.username || "-"}</p>
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {order.items.map((item, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-gray-100 rounded">
                            {item.productName} ({item.width}×{item.height}m)
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#6B7280]">
                      {new Date(order.createdAt).toLocaleDateString("az-AZ")}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#1F2937]">
                      {order.totalAmount?.toFixed(2)} AZN
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as Order["status"])}
                          className="text-sm border border-gray-200 rounded px-2 py-1"
                        >
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
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>
    </motion.div>
  );
}

// Admin Settings Component
function AdminSettings() {
  const [currentSettings, setCurrentSettings] = useState<SystemSettings>(settings.get());
  const [formData, setFormData] = useState({
    unitPricePerSqm: currentSettings.unitPricePerSqm,
    monthlyBonus500: currentSettings.monthlyBonus500,
    monthlyBonus1000: currentSettings.monthlyBonus1000,
    bannerDiscount: currentSettings.productDiscounts.banner,
    vinylDiscount: currentSettings.productDiscounts.vinyl,
    posterDiscount: currentSettings.productDiscounts.poster,
    canvasDiscount: currentSettings.productDiscounts.canvas,
    oracalDiscount: currentSettings.productDiscounts.oracal,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const updated = settings.update({
      unitPricePerSqm: formData.unitPricePerSqm,
      monthlyBonus500: formData.monthlyBonus500,
      monthlyBonus1000: formData.monthlyBonus1000,
      productDiscounts: {
        banner: formData.bannerDiscount,
        vinyl: formData.vinylDiscount,
        poster: formData.posterDiscount,
        canvas: formData.canvasDiscount,
        oracal: formData.oracalDiscount,
      }
    });
    setCurrentSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    const reset = settings.reset();
    setCurrentSettings(reset);
    setFormData({
      unitPricePerSqm: reset.unitPricePerSqm,
      monthlyBonus500: reset.monthlyBonus500,
      monthlyBonus1000: reset.monthlyBonus1000,
      bannerDiscount: reset.productDiscounts.banner,
      vinylDiscount: reset.productDiscounts.vinyl,
      posterDiscount: reset.productDiscounts.poster,
      canvasDiscount: reset.productDiscounts.canvas,
      oracalDiscount: reset.productDiscounts.oracal,
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1F2937]">Sistem Ayarları</h1>
        {saved && (
          <span className="text-green-600 font-medium">✓ Ayarlar yadda saxlandı!</span>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pricing Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#D90429]" />
            Qiymət Ayarları
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">
                1 m² qiymət (AZN)
              </label>
              <input
                type="number"
                value={formData.unitPricePerSqm}
                onChange={(e) => setFormData({...formData, unitPricePerSqm: parseFloat(e.target.value) || 0})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
              />
            </div>
          </div>
        </Card>

        {/* Monthly Bonus Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#D90429]" />
            Aylıq Bonus Endirimləri
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">
                500 AZN keçəndə bonus (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.monthlyBonus500}
                onChange={(e) => setFormData({...formData, monthlyBonus500: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">
                1000 AZN keçəndə bonus (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.monthlyBonus1000}
                onChange={(e) => setFormData({...formData, monthlyBonus1000: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
              />
            </div>
          </div>
        </Card>

        {/* Product Discounts */}
        <Card className="p-6 md:col-span-2">
          <h2 className="text-lg font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#D90429]" />
            Məhsul Endirimləri (%)
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { key: "bannerDiscount", label: "Banner" },
              { key: "vinylDiscount", label: "Vinil" },
              { key: "posterDiscount", label: "Poster" },
              { key: "canvasDiscount", label: "Kətan" },
              { key: "oracalDiscount", label: "Oracal" },
            ].map((item) => (
              <div key={item.key}>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">
                  {item.label}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData[item.key as keyof typeof formData]}
                  onChange={(e) => setFormData({...formData, [item.key]: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6">
        <Button onClick={handleSave} icon={<Save className="w-4 h-4" />}>
          Ayarları yadda saxla
        </Button>
        <Button variant="secondary" onClick={handleReset}>
          Default-a qaytar
        </Button>
      </div>
    </motion.div>
  );
}

// Admin Tasks Component
function AdminTasks({ allUsers }: { allUsers: User[] }) {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    decoratorId: "",
    title: "",
    description: "",
    deadline: ""
  });

  useEffect(() => {
    setAllTasks(tasks.getAll());
  }, []);

  const decorators = allUsers.filter(u => u.role === "DECORATOR");

  const handleCreateTask = () => {
    if (!formData.decoratorId || !formData.title || !formData.deadline) return;
    
    tasks.create({
      decoratorId: formData.decoratorId,
      title: formData.title,
      description: formData.description,
      deadline: formData.deadline,
      createdBy: "admin"
    });
    
    setAllTasks(tasks.getAll());
    setShowForm(false);
    setFormData({ decoratorId: "", title: "", description: "", deadline: "" });
  };

  const handleDeleteTask = (id: string) => {
    tasks.delete(id);
    setAllTasks(tasks.getAll());
  };

  const getStatusBadge = (status: Task["status"]) => {
    const styles = {
      pending: "bg-amber-100 text-amber-700",
      in_progress: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-gray-100 text-gray-700"
    };
    const labels = {
      pending: "Gözləyir",
      in_progress: "İcrada",
      completed: "Tamamlandı",
      cancelled: "Ləğv edildi"
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>{labels[status]}</span>;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1F2937]">Tapşırıqlar</h1>
        <Button onClick={() => setShowForm(!showForm)} icon={<Plus className="w-4 h-4" />}>
          Tapşırıq əlavə et
        </Button>
      </div>

      {/* Create Task Form */}
      {showForm && (
        <Card className="p-6 mb-6">
          <h3 className="font-bold text-[#1F2937] mb-4">Yeni Tapşırıq</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Dekorçu seç</label>
              <select
                value={formData.decoratorId}
                onChange={(e) => setFormData({...formData, decoratorId: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
              >
                <option value="">Dekorçu seç</option>
                {decorators.map(d => (
                  <option key={d.id} value={d.id}>{d.fullName} (@{d.username})</option>
                ))}
              </select>
              {decorators.length === 0 && (
                <p className="text-xs text-red-500 mt-1">Dekorçu yoxdur</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Son tarix</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Tapşırıq başlığı</label>
              <input
                type="text"
                placeholder="Məs: 3 banner sifarişini tamamla"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Açıqlama</label>
              <textarea
                placeholder="Ətraflı yaz..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
              />
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <Button onClick={handleCreateTask} icon={<CheckCircle className="w-4 h-4" />}>
              Tapşırıq əlavə et
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Ləğv et
            </Button>
          </div>
        </Card>
      )}

      {/* Tasks List */}
      <div className="space-y-4">
        {allTasks.length === 0 ? (
          <Card className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-[#6B7280]">Hələ tapşırıq yoxdur</p>
          </Card>
        ) : (
          allTasks.map(task => {
            const decorator = allUsers.find(u => u.id === task.decoratorId);
            return (
              <Card key={task.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-[#1F2937]">{task.title}</h3>
                      {getStatusBadge(task.status)}
                    </div>
                    <p className="text-sm text-[#6B7280] mb-2">{task.description}</p>
                    <div className="flex items-center gap-4 text-xs text-[#9CA3AF]">
                      <span className="flex items-center gap-1">
                        <UserCircle className="w-4 h-4" />
                        {decorator?.fullName || "Naməlum"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Son tarix: {new Date(task.deadline).toLocaleDateString("az-AZ")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Yaradılıb: {new Date(task.createdAt).toLocaleDateString("az-AZ")}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

// Send Notification Form Component
function SendNotificationForm({ userId, onSend }: { userId: string; onSend: (title: string, message: string) => void }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && message.trim()) {
      onSend(title, message);
      setTitle("");
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="Bildiriş başlığı"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
      />
      <textarea
        placeholder="Bildiriş mətni"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
      />
      <Button type="submit" size="sm" icon={<Bell className="w-4 h-4" />}>
        Göndər
      </Button>
    </form>
  );
}
