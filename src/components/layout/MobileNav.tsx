"use client";

import { cn } from "@/lib/utils";
import { Home, PlusCircle, History, User, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUnreadActivityDots } from "@/hooks/useUnreadActivityDots";

interface MobileNavProps {
  variant?: "decorator" | "admin";
}

const decoratorItems = [
  { icon: Home, label: "Əsas", href: "/dashboard" },
  { icon: PlusCircle, label: "Sifariş", href: "/orders/new" },
  { icon: History, label: "Tarixçə", href: "/dashboard/orders" },
  { icon: User, label: "Profil", href: "/profile" },
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
  const activity = useUnreadActivityDots(variant === "decorator" && pathname.startsWith("/dashboard"));
  const showHomeDot =
    variant === "decorator" && (activity.notifyUnread > 0 || activity.supportUnread > 0);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E7EB] md:hidden">
      <div className="flex items-center justify-around px-4 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href);
          const homeDot = item.href === "/dashboard" && showHomeDot;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors",
                isActive ? "text-[#D90429]" : "text-[#6B7280]"
              )}
            >
              <span className="relative inline-flex">
                <Icon className="w-6 h-6" />
                {homeDot && (
                  <span
                    className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[#D90429] ring-2 ring-white"
                    aria-hidden
                  />
                )}
              </span>
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
