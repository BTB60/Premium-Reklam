"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import StatsCards from "./StatsCards";
import UsersTable from "./UsersTable";
import OrdersTable from "./OrdersTable";
import NotificationsList from "./NotificationsList";
import AnalyticsDashboard from "./AnalyticsDashboard";
import ProductsManager from "./ProductsManager";
import SettingsManager from "./SettingsManager";
import AccessSettingsManager from "./AccessSettingsManager";
import { 
  Shield, Users, Package, Bell, BarChart3, Store, Wallet, Boxes, 
  ClipboardList, Headphones, Settings, LogOut, Menu, ChevronLeft, Key,
  TrendingUp, Award
} from "lucide-react";

type ActiveTab = "dashboard" | "users" | "orders" | "notifications" | "analytics" | "products" | "finance" | "inventory" | "workerTasks" | "support" | "settings" | "tasks" | "accessSettings";
type PermissionLevel = "none" | "view" | "edit";

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

const ALL_NAV_ITEMS: { id: ActiveTab; label: string; icon: any; permission?: keyof SubadminSession["permissions"]; adminOnly?: boolean }[] = [
  { id: "dashboard", label: "Dashboard", icon: TrendingUp },
  { id: "users", label: "İstifadəçilər", icon: Users, permission: "users" },
  { id: "orders", label: "Sifarişlər", icon: Package, permission: "orders" },
  { id: "notifications", label: "Bildirişlər", icon: Bell, permission: "support" },
  { id: "analytics", label: "Analytics", icon: BarChart3, permission: "analytics" },
  { id: "products", label: "Məhsullar", icon: Store, permission: "products" },
  { id: "finance", label: "Maliyyə", icon: Wallet, permission: "finance" },
  { id: "inventory", label: "Anbar", icon: Boxes, permission: "inventory" },
  { id: "workerTasks", label: "Tapşırıqlar", icon: ClipboardList, permission: "tasks" },
  { id: "support", label: "Dəstək", icon: Headphones, permission: "support" },
  { id: "settings", label: "Sistem Ayarları", icon: Settings, permission: "settings" },
  { id: "accessSettings", label: "Giriş Ayarları", icon: Shield, adminOnly: true },
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
  const [lang, setLang] = useState<"az" | "en">("az");

  const isAdmin = user?.role === "ADMIN";
  const permissions = subadminSession?.permissions;

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

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <header className="bg-[#1F2937] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-white/10 rounded-lg">
                <Menu className="w-6 h-6" />
              </button>
              <Shield className="w-6 h-6 text-[#D90429]" />
              <span className="font-bold text-lg">Admin Panel</span>
              <span className="text-xs text-gray-400">
                {user?.role} {subadminSession && `(${subadminSession.login})`}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setLang(lang === "az" ? "en" : "az")} icon={<Key className="w-4 h-4" />}>
                {lang.toUpperCase()}
              </Button>
              <span className="text-gray-400 text-sm hidden sm:block">{user?.fullName}</span>
              <Button variant="ghost" size="sm" onClick={onLogout} icon={<LogOut className="w-4 h-4" />}>
                <span className="hidden sm:inline">Çıxış</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white min-h-screen border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
          <div className="flex items-center justify-between p-4 lg:hidden">
            <span className="font-bold text-lg">Menyu</span>
            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { onTabChange(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id ? "bg-[#D90429] text-white" : "text-[#6B7280] hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StatsCards />
              </motion.div>
            )}
            {activeTab === "users" && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <UsersTable />
              </motion.div>
            )}
            {activeTab === "orders" && (
              <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <OrdersTable />
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
            {activeTab === "finance" && (
              <motion.div key="finance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-[#6B7280]">Maliyyə tezliklə əlavə olunacaq...</div>
              </motion.div>
            )}
            {activeTab === "inventory" && (
              <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-[#6B7280]">Anbar tezliklə əlavə olunacaq...</div>
              </motion.div>
            )}
            {activeTab === "workerTasks" && (
              <motion.div key="workerTasks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-[#6B7280]">Tapşırıqlar tezliklə əlavə olunacaq...</div>
              </motion.div>
            )}
            {activeTab === "support" && (
              <motion.div key="support" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-[#6B7280]">Dəstək tezliklə əlavə olunacaq...</div>
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
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}