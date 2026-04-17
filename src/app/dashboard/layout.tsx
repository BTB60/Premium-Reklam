"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authApi } from "@/lib/authApi";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { Button } from "@/components/ui/Button";
import { 
  LogOut, RefreshCw, User, ShoppingBag, Package, Store, Headphones 
} from "lucide-react";

const TABS = [
  { id: "home", label: "Ana Səhifə", icon: User, href: "/dashboard" },
  { id: "products", label: "Məhsullar", icon: ShoppingBag, href: "/dashboard/products" },
  { id: "orders", label: "Sifarişlərim", icon: Package, href: "/dashboard/orders" },
  { id: "store", label: "Mağazam", icon: Store, href: "/dashboard/store" },
  { id: "support", label: "Onlayn müraciət", icon: Headphones, href: "/dashboard/support" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const checkSession = () => {
      if (typeof window === "undefined") return;
      
      let currentUser = (authApi as any).getCurrentUser?.() || null;
      
      if (!currentUser) {
        try {
          const raw = localStorage.getItem("decor_current_user");
          if (raw) {
            currentUser = JSON.parse(raw);
          }
        } catch (e) {
          console.warn("[DashboardLayout] Failed to parse session:", e);
        }
      }
      
      if (!currentUser) {
        router.push("/login");
        return;
      }
      
      if (currentUser.role === "ADMIN") {
        router.push("/admin/dashboard");
        return;
      }
      
      setUser(currentUser);
    };
    
    const timer = setTimeout(checkSession, 50);
    return () => clearTimeout(timer);
  }, [router]);

  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("decor_current_user");
      localStorage.removeItem("premium_session_type");
    }
    authApi.logout();
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E5E7EB] border-t-[#D90429] rounded-full animate-spin" />
      </div>
    );
  }

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
            <NotificationBell />
            <Button variant="ghost" size="sm" onClick={handleRefresh} icon={<RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />}>
              <span className="sr-only">Yenilə</span>
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
          {TABS.map((tab) => {
            const isActive = pathname === tab.href || (tab.href === "/dashboard" && pathname === "/dashboard");
            return (
              <button
                key={tab.id}
                onClick={() => router.push(tab.href)}
                className={`flex items-center gap-2 px-5 py-4 border-b-2 whitespace-nowrap text-sm font-medium transition-colors ${
                  isActive
                    ? "border-[#D90429] text-[#D90429]"
                    : "border-transparent text-[#6B7280] hover:text-[#1F2937]"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {children}
      </main>
    </div>
  );
}