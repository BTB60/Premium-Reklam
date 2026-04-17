"use client";
import { useState, useEffect } from "react";
import { Menu, X, MessageCircle } from "lucide-react";
import { authApi } from "@/lib/authApi";
import { HeaderLogo } from "./HeaderLogo";
import { HeaderNav } from "./HeaderNav";
import { NotificationBell } from "./NotificationBell";
import { SupportModal } from "./SupportModal";
import { MobileMenu } from "./MobileMenu";
import { UserAvatar } from "./UserAvatar";

interface HeaderProps {
  variant?: "public" | "decorator" | "admin";
  userName?: string;
  notifications?: number;
}

const publicNavItems = [
  { label: "Ana Səhifə", href: "/" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Xidmətlər", href: "#services" },
  { label: "Necə işləyir", href: "#how-it-works" },
  { label: "Qiymət", href: "#pricing" },
  { label: "Əlaqə", href: "#contact" },
];

const decoratorNavItems = [
  { label: "Ana Səhifə", href: "/" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Sifariş Yarat", href: "/dashboard/orders/new" },
  { label: "Tarixçə", href: "/dashboard/orders" },
  { label: "Dəstək", href: "/dashboard/support" },
  { label: "Bildirişlər", href: "/notifications" },
];

const adminNavItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Sifarişlər", href: "/admin/orders" },
  { label: "İstifadəçilər", href: "/admin/users" },
  { label: "Maliyyə", href: "/admin/finance" },
];

export function Header({ variant = "public", userName }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    if (authApi.getCurrentUser()) setIsAuth(true);
  }, []);

  const navItems = variant === "public" ? publicNavItems : variant === "decorator" ? decoratorNavItems : adminNavItems;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#E5E5E5] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <HeaderLogo />
          <HeaderNav items={navItems} />

          <div className="flex items-center gap-2 sm:gap-3">
            {/* ✅ ВЫНЕСЕНО ЗА УСЛОВИЕ: всегда в DOM */}
            <NotificationBell />

            {(variant !== "public" || isAuth) ? (
              <>
                <button 
                  onClick={() => setSupportOpen(true)} 
                  className="relative p-2.5 text-[#4A4A4A] hover:text-[#059669] hover:bg-gray-100 rounded-xl transition-all" 
                  title="Canlı Dəstək"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
                <UserAvatar userName={userName} variant={variant} isAuth={isAuth} />
              </>
            ) : (
              <>
                <a href="/login" className="px-4 py-2 text-[#0A0A0A] font-medium hover:text-[#C41E3A] transition-colors text-sm">Daxil ol</a>
                <a href="/register" className="px-5 py-2.5 bg-gradient-to-r from-[#C41E3A] to-[#9A1529] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all text-sm hidden sm:inline-block">Qeydiyyat</a>
              </>
            )}

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="lg:hidden p-2.5 text-[#4A4A4A] hover:bg-gray-100 rounded-xl transition-all"
              aria-label="Menyu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} items={navItems} variant={variant} isAuth={isAuth} />
      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
    </header>
  );
}