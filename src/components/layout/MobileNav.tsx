"use client";

import { cn } from "@/lib/utils";
import { Home, PlusCircle, History, User, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileNavProps {
  variant?: "decorator" | "admin";
}

const decoratorItems = [
  { icon: Home, label: "Əsas", href: "/dashboard" },
  { icon: PlusCircle, label: "Sifariş", href: "/dashboard/orders/new" },
  { icon: History, label: "Tarixçə", href: "/dashboard/orders" },
  { icon: User, label: "Profil", href: "/dashboard/profile" },
];

const adminItems = [
  { icon: Home, label: "Dashboard", href: "/admin" },
  { icon: PlusCircle, label: "Sifarişlər", href: "/admin/orders" },
  { icon: Settings, label: "Tənzimləmələr", href: "/admin/settings" },
  { icon: User, label: "Profil", href: "/admin/profile" },
];

export function MobileNav({ variant = "decorator" }: MobileNavProps) {
  const pathname = usePathname();
  const items = variant === "decorator" ? decoratorItems : adminItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E7EB] md:hidden">
      <div className="flex items-center justify-around px-4 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors",
                isActive ? "text-[#D90429]" : "text-[#6B7280]"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </nav>
  );
}
