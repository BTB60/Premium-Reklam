"use client";

import { Button } from "@/components/ui/Button";
import AdminNotificationBell from "./AdminNotificationBell";
import { Shield, LogOut, Menu, Key } from "lucide-react";

interface DashboardHeaderProps {
  user: any;
  subadminSession: any;
  onSidebarToggle: () => void;
  onLangToggle: () => void;
  onLogout: () => void;
  onNavigateToNotifications: () => void;
  lang: "az" | "en";
}

export default function DashboardHeader({
  user,
  subadminSession,
  onSidebarToggle,
  onLangToggle,
  onLogout,
  onNavigateToNotifications,
  lang,
}: DashboardHeaderProps) {
  return (
    <header className="bg-[#1F2937] text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button onClick={onSidebarToggle} className="lg:hidden p-2 hover:bg-white/10 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <Shield className="w-6 h-6 text-[#D90429]" />
            <span className="font-bold text-lg">Admin Panel</span>
            <span className="text-xs text-gray-400">
              {user?.role} {subadminSession && `(${subadminSession.login})`}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <AdminNotificationBell onNavigate={onNavigateToNotifications} user={user} />
            <Button variant="ghost" size="sm" onClick={onLangToggle} icon={<Key className="w-4 h-4" />}>
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
  );
}