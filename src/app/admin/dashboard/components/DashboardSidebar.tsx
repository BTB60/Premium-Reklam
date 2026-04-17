"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import type { ActiveTab, PermissionLevel } from "./types";

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: any;
  permission?: string;
  adminOnly?: boolean;
}

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  navItems: NavItem[];
  isAdmin: boolean;
  permissions?: Record<string, PermissionLevel>;
}

function hasPermission(permissions: Record<string, PermissionLevel> | undefined, feature: string, level: PermissionLevel = "view"): boolean {
  if (!permissions) return false;
  const perm = permissions[feature];
  if (level === "edit") return perm === "edit";
  if (level === "view") return perm === "view" || perm === "edit";
  return false;
}

export default function DashboardSidebar({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  navItems,
  isAdmin,
  permissions,
}: DashboardSidebarProps) {
  const filteredItems = navItems.filter((item) => {
    if (isAdmin) return true;
    if (item.adminOnly) return false;
    if (!item.permission) return true;
    return hasPermission(permissions, item.permission);
  });

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white min-h-screen border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="font-bold text-lg">Menyu</span>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { onTabChange(item.id); onClose(); }}
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
    </>
  );
}