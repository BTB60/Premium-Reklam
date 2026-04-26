"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import StatsCards from "./StatsCards";
import UsersTable from "./UsersTable";
import OrdersTable from "./OrdersTable";
import NotificationsList from "./NotificationsList";
import AnalyticsDashboard from "./AnalyticsDashboard";
import ProductsManager from "./ProductsManager";
import FinanceDashboard from "./FinanceDashboard";
import InventoryManager from "./InventoryManager";
import WorkerTasksManager from "./WorkerTasksManager";
import ShopsManager from "./ShopsManager";
import SupportManager from "./SupportManager";
import ElanManager from "./ElanManager";
import SettingsManager from "./SettingsManager";
import AccessSettingsManager from "./AccessSettingsManager";
import HomeCarouselManager from "./HomeCarouselManager";
import HomePromoBannerManager from "./HomePromoBannerManager";
import AuditLogsPanel from "./AuditLogsPanel";
import UserPricesManager from "./UserPricesManager";
import { RealtimeNotificationsHost } from "@/components/realtime/RealtimeNotificationsHost";
import { ServerNotificationsMarkAllButton } from "@/components/realtime/ServerNotificationsMarkAllButton";
import { 
  Shield, Users, Package, Bell, BarChart3, Store, Wallet, Boxes, 
  ClipboardList, Headphones, Settings, LogOut, Menu, ChevronLeft, Key,
  TrendingUp, Award, Megaphone, History, Tag, Lock, Image as ImageIcon, PanelTop
} from "lucide-react";
import { authApi, orderApi } from "@/lib/authApi";
import { fetchMyInAppNotifications } from "@/lib/clientPaymentNotificationsApi";
import { getAdminMockPendingBreakdown } from "@/lib/adminPendingActivity";
import { adminSupportChatFetchThreads } from "@/lib/adminSupportChatApi";
import { isOrderOverdue, isOrderStale } from "@/lib/orderDelay";
import AdminNotificationBell from "./AdminNotificationBell";

// 🔥 ТИПЫ
type PermissionLevel = "none" | "view" | "edit";

type ActiveTab = "dashboard" | "users" | "orders" | "shops" | "elan" | "homeCarousel" | "homePromo" | "notifications" | "analytics" | "products" | "userPrices" | "finance" | "inventory" | "workerTasks" | "support" | "settings" | "tasks" | "accessSettings" | "auditLogs";

interface SubadminSession {
  subadminId: string;
  login: string;
  role: "SUBADMIN";
  permissions: Record<string, PermissionLevel>;
}

interface DashboardLayoutProps {
  user: any;
  subadminSession: SubadminSession | null;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLogout: () => void;
}

function normalizeRole(raw?: string): string {
  const role = String(raw || "").trim().toUpperCase();
  if (role.startsWith("ROLE_")) return role.slice(5);
  return role;
}

const ALL_NAV_ITEMS: { id: ActiveTab; labelAz: string; labelEn: string; icon: any; permission?: keyof SubadminSession["permissions"]; adminOnly?: boolean }[] = [
  { id: "dashboard", labelAz: "Dashboard", labelEn: "Dashboard", icon: TrendingUp },
  { id: "users", labelAz: "İstifadəçilər", labelEn: "Users", icon: Users, permission: "users" },
  { id: "orders", labelAz: "Sifarişlər", labelEn: "Orders", icon: Package, permission: "orders" },
  { id: "shops", labelAz: "Mağazalar", labelEn: "Shops", icon: Store, permission: "products" },
  { id: "elan", labelAz: "Elanlar", labelEn: "Announcements", icon: Megaphone, adminOnly: true },
  { id: "homeCarousel", labelAz: "Ana səhifə karuseli", labelEn: "Home carousel", icon: ImageIcon, adminOnly: true },
  { id: "homePromo", labelAz: "Ana səhifə promo zolağı", labelEn: "Home promo strip", icon: PanelTop, adminOnly: true },
  { id: "notifications", labelAz: "Bildirişlər", labelEn: "Notifications", icon: Bell, permission: "support" },
  { id: "analytics", labelAz: "Analitika", labelEn: "Analytics", icon: BarChart3, permission: "analytics" },
  { id: "products", labelAz: "Məhsullar", labelEn: "Products", icon: Store, permission: "products" },
  { id: "userPrices", labelAz: "Müştəri qiymətləri", labelEn: "Customer prices", icon: Tag, adminOnly: true },
  { id: "finance", labelAz: "Maliyyə", labelEn: "Finance", icon: Wallet, permission: "finance" },
  { id: "inventory", labelAz: "Anbar", labelEn: "Inventory", icon: Boxes, permission: "inventory" },
  { id: "workerTasks", labelAz: "Tapşırıqlar", labelEn: "Tasks", icon: ClipboardList, permission: "tasks" },
  { id: "support", labelAz: "Dəstək", labelEn: "Support", icon: Headphones, permission: "support" },
  { id: "settings", labelAz: "Sistem Ayarları", labelEn: "System Settings", icon: Settings, permission: "settings" },
  { id: "auditLogs", labelAz: "Audit Jurnalı", labelEn: "Audit Logs", icon: History, adminOnly: true },
  { id: "accessSettings", labelAz: "Giriş Ayarları", labelEn: "Access Settings", icon: Shield, adminOnly: true },
];

function hasPermission(permissions: Record<string, PermissionLevel> | undefined, feature: string, level: PermissionLevel = "view"): boolean {
  if (!permissions) return false;
  const perm = permissions[feature];
  if (level === "edit") return perm === "edit";
  if (level === "view") return perm === "view" || perm === "edit";
  return false;
}

export default function DashboardLayout({ user, subadminSession, activeTab, onTabChange, onLogout }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [lang, setLang] = useState<"az" | "en">(() => {
    if (typeof window === "undefined") return "az";
    const saved = localStorage.getItem("premium_admin_lang");
    return saved === "en" ? "en" : "az";
  });

  const [adminNavDots, setAdminNavDots] = useState({ serverUnread: 0, orders: 0, shops: 0, support: 0 });

  const refreshAdminNavDots = useCallback(async () => {
    try {
      const m = getAdminMockPendingBreakdown();
      const [rows, supportThreads, orderData] = await Promise.all([
        fetchMyInAppNotifications().catch(() => []),
        adminSupportChatFetchThreads().catch(() => []),
        orderApi.getOrdersFromBackend().catch(() => ({ orders: [] })),
      ]);
      const serverUnread = rows.filter((r) => !r.isRead).length;
      const support = supportThreads.reduce((sum, t) => sum + Number(t.unreadForAdmin || 0), 0);
      const delayedOrders = (orderData.orders || []).filter((o) => isOrderOverdue(o) || isOrderStale(o)).length;
      setAdminNavDots({
        serverUnread,
        orders: m.newOrdersPendingApproval + delayedOrders,
        shops: m.storeRequests,
        support,
      });
    } catch {
      setAdminNavDots({ serverUnread: 0, orders: 0, shops: 0, support: 0 });
    }
  }, []);

  useEffect(() => {
    void refreshAdminNavDots();
    const id = setInterval(() => void refreshAdminNavDots(), 30000);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "decor_store_requests" || e.key === "decor_orders") void refreshAdminNavDots();
    };
    const onInApp = () => void refreshAdminNavDots();
    window.addEventListener("storage", onStorage);
    window.addEventListener("premium:inapp-dismiss-all", onInApp);
    window.addEventListener("premium:inapp-mark-read", onInApp);
    return () => {
      clearInterval(id);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("premium:inapp-dismiss-all", onInApp);
      window.removeEventListener("premium:inapp-mark-read", onInApp);
    };
  }, [refreshAdminNavDots]);

  const isAdmin = normalizeRole(user?.role) === "ADMIN";
  const permissions = subadminSession?.permissions;
  const ui = {
    az: {
      panelTitle: "Admin Panel",
      logout: "Çıxış",
      menu: "Menyu",
      roleLabel: "Rol",
      userLabel: "İstifadəçi",
    },
    en: {
      panelTitle: "Admin Panel",
      logout: "Logout",
      menu: "Menu",
      roleLabel: "Role",
      userLabel: "User",
    },
  }[lang];

  const navItems = ALL_NAV_ITEMS.filter((item) => {
    if (isAdmin) return true;
    if (item.adminOnly) return false;
    if (!item.permission) return true;
    return hasPermission(permissions, item.permission);
  });

  const currentTabAllowed = navItems.some((item) => item.id === activeTab);
  if (!currentTabAllowed && activeTab !== "dashboard") {
    onTabChange("dashboard");
  }

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
  };

  const submitPasswordChange = async () => {
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError(lang === "az" ? "Yeni şifrə ən azı 6 simvol olmalıdır." : "New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(lang === "az" ? "Yeni şifrə təkrarı uyğun gəlmir." : "New password confirmation does not match.");
      return;
    }
    setPasswordBusy(true);
    try {
      await authApi.changeMyPassword(currentPassword, newPassword);
      resetPasswordForm();
      setPasswordOpen(false);
    } catch (e: any) {
      setPasswordError(e?.message || (lang === "az" ? "Şifrə dəyişdirilə bilmədi" : "Could not change password"));
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-[#0e0f13]/92 text-white sticky top-0 z-50 border-b border-[#2a2d34] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-white/10 rounded-xl">
                <Menu className="w-6 h-6" />
              </button>
              <Shield className="w-6 h-6 text-[#ff6600]" />
              <span className="font-bold text-lg">{ui.panelTitle}</span>
              <span className="text-xs text-gray-400">
                {ui.roleLabel}: {user?.role} {subadminSession && `(${subadminSession.login})`}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <AdminNotificationBell />
              <ServerNotificationsMarkAllButton className="hidden sm:inline text-[#ffb383] hover:text-[#ff6600]" />
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    resetPasswordForm();
                    setPasswordOpen(true);
                  }}
                  icon={<Lock className="w-4 h-4" />}
                >
                  <span className="hidden sm:inline">{lang === "az" ? "Şifrə" : "Password"}</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const nextLang = lang === "az" ? "en" : "az";
                  setLang(nextLang);
                  localStorage.setItem("premium_admin_lang", nextLang);
                }}
                icon={<Key className="w-4 h-4" />}
              >
                {lang.toUpperCase()}
              </Button>
              <span className="text-gray-400 text-sm hidden sm:block">{ui.userLabel}: {user?.fullName}</span>
              <Button variant="ghost" size="sm" onClick={onLogout} icon={<LogOut className="w-4 h-4" />}>
                <span className="hidden sm:inline">{ui.logout}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[var(--card-glass)] min-h-screen border-r border-[var(--border)] backdrop-blur-xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
          <div className="flex items-center justify-between p-4 lg:hidden">
            <span className="font-bold text-lg">{ui.menu}</span>
            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const showDot =
                (item.id === "notifications" && adminNavDots.serverUnread > 0) ||
                (item.id === "orders" && adminNavDots.orders > 0) ||
                (item.id === "shops" && adminNavDots.shops > 0) ||
                (item.id === "support" && adminNavDots.support > 0);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onTabChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === item.id
                      ? "bg-gradient-to-r from-[#ff6600] to-[#de5800] text-white shadow-[0_0_18px_rgba(255,102,0,0.32)]"
                      : "text-[var(--text-secondary)] hover:bg-[#fff1e9] hover:text-[#101010]"
                  }`}
                >
                  <span className="relative inline-flex">
                    <item.icon className="w-5 h-5" />
                    {showDot && (
                      <span
                        className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ${
                          activeTab === item.id
                            ? "bg-white ring-[#de5800]"
                            : "bg-[#D90429] ring-[var(--card-glass)]"
                        }`}
                        aria-hidden
                      />
                    )}
                  </span>
                  <span className="text-sm flex-1 text-left">
                    {lang === "az" ? item.labelAz : item.labelEn}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StatsCards onNavigate={onTabChange} />
              </motion.div>
            )}
            {activeTab === "users" && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <UsersTable canDeleteUsers={isAdmin} />
              </motion.div>
            )}
            {activeTab === "orders" && (
              <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <OrdersTable />
              </motion.div>
            )}
            {activeTab === "shops" && (
              <motion.div key="shops" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ShopsManager />
              </motion.div>
            )}
            {activeTab === "elan" && (
              <motion.div key="elan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ElanManager />
              </motion.div>
            )}
            {activeTab === "homeCarousel" && (
              <motion.div key="homeCarousel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <HomeCarouselManager />
              </motion.div>
            )}
            {activeTab === "homePromo" && (
              <motion.div key="homePromo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <HomePromoBannerManager />
              </motion.div>
            )}
            {activeTab === "notifications" && (
              <motion.div key="notifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <NotificationsList />
              </motion.div>
            )}
            {activeTab === "analytics" && (
              <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AnalyticsDashboard />
              </motion.div>
            )}
            {activeTab === "products" && (
              <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ProductsManager />
              </motion.div>
            )}
            {activeTab === "userPrices" && (
              <motion.div key="userPrices" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <UserPricesManager />
              </motion.div>
            )}
            {activeTab === "finance" && (
              <motion.div key="finance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <FinanceDashboard />
              </motion.div>
            )}
            {activeTab === "inventory" && (
              <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <InventoryManager />
              </motion.div>
            )}
            {activeTab === "workerTasks" && (
              <motion.div key="workerTasks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <WorkerTasksManager />
              </motion.div>
            )}
            {activeTab === "support" && (
              <motion.div key="support" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SupportManager />
              </motion.div>
            )}
            {activeTab === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SettingsManager />
              </motion.div>
            )}
            {activeTab === "accessSettings" && (
              <motion.div key="accessSettings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AccessSettingsManager />
              </motion.div>
            )}
            {activeTab === "auditLogs" && (
              <motion.div key="auditLogs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AuditLogsPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
      <RealtimeNotificationsHost />

      {passwordOpen && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {lang === "az" ? "Şifrəni dəyiş" : "Change password"}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {lang === "az" ? "Cari və yeni şifrənizi daxil edin." : "Enter your current and new password."}
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm text-[var(--text-secondary)]">
                {lang === "az" ? "Cari şifrə" : "Current password"}
                <input
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)]"
                />
              </label>
              <label className="block text-sm text-[var(--text-secondary)]">
                {lang === "az" ? "Yeni şifrə" : "New password"}
                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)]"
                />
              </label>
              <label className="block text-sm text-[var(--text-secondary)]">
                {lang === "az" ? "Yeni şifrə (təkrar)" : "Confirm new password"}
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)]"
                />
              </label>
            </div>
            {passwordError && <p className="mt-3 text-sm text-red-600">{passwordError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetPasswordForm();
                  setPasswordOpen(false);
                }}
                disabled={passwordBusy}
              >
                {lang === "az" ? "Ləğv et" : "Cancel"}
              </Button>
              <Button size="sm" onClick={submitPasswordChange} disabled={passwordBusy}>
                {passwordBusy ? "…" : lang === "az" ? "Yadda saxla" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}