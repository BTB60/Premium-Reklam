"use client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem { label: string; href: string; }
interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  variant: string;
  isAuth: boolean;
}

export function MobileMenu({ isOpen, onClose, items, variant, isAuth }: MobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="lg:hidden bg-white border-t border-[#E5E5E5] shadow-lg"
        >
          <nav className="px-4 py-4 space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="block px-4 py-3.5 text-[#4A4A4A] hover:text-[#C41E3A] hover:bg-gray-50 rounded-xl font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
            {variant === "public" && !isAuth && (
              <div className="pt-4 mt-4 border-t border-[#E5E5E5] space-y-2">
                <Link href="/login" onClick={onClose} className="block px-4 py-3.5 text-[#0A0A0A] font-medium bg-gray-50 rounded-xl text-center">Daxil ol</Link>
                <Link href="/register" onClick={onClose} className="block px-4 py-3.5 bg-gradient-to-r from-[#C41E3A] to-[#9A1529] text-white font-semibold rounded-xl text-center shadow-sm">Qeydiyyat</Link>
              </div>
            )}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}