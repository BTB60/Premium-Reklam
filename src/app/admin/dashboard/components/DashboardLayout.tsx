"use client";

import { useState } from "react";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTabs from "./DashboardTabs";
import type { ActiveTab, SubadminSession, NavItemConfig } from "./types";
import { TrendingUp, Users, Package, Store, Megaphone, Bell, BarChart3, Wallet, Boxes, ClipboardList, Headphones, Settings, Shield } from "lucide-react";

interface DashboardLayoutProps {
  user: any;
  subadminSession: SubadminSession | null;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLogout: () => void;
}

const ALL_NAV_ITEMS: NavItemConfig[] = [
  { id: "dashboard", label: "Dashboard", icon: TrendingUp },
  { id: "users", label: "İstifadəçilər", icon: Users, permission: "users" },
  { id: "orders", label: "Sifarişlər", icon: Package, permission: "orders" },
  { id: "shops", label: "Mağazalar", icon: Store, permission: "products" },
  { id: "elan", label: "Elanlar", icon: Megaphone, adminOnly: true },
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

export default function DashboardLayout({ user, subadminSession, activeTab, onTabChange, onLogout }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lang, setLang] = useState<"az" | "en">("az");

  const isAdmin = user?.role === "ADMIN";
  const permissions = subadminSession?.permissions;

  // Проверка доступа к текущей вкладке
  const navItems = ALL_NAV_ITEMS.filter((item) => {
    if (isAdmin) return true;
    if (item.adminOnly) return false;
    if (!item.permission) return true;
    const perm = permissions?.[item.permission];
    return perm === "view" || perm === "edit";
  });

  const currentTabAllowed = navItems.some((item) => item.id === activeTab);
  if (!currentTabAllowed && activeTab !== "dashboard") {
    onTabChange("dashboard");
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <DashboardHeader
        user={user}
        subadminSession={subadminSession}
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        onLangToggle={() => setLang(lang === "az" ? "en" : "az")}
        onLogout={onLogout}
        onNavigateToNotifications={() => onTabChange("notifications")}
        lang={lang}
      />

      <div className="flex relative">
        <DashboardSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeTab}
          onTabChange={onTabChange}
          navItems={ALL_NAV_ITEMS}
          isAdmin={isAdmin}
          permissions={permissions}
        />

        <DashboardTabs activeTab={activeTab} />
      </div>
    </div>
  );
}