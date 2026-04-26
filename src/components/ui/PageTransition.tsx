"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function PageTransition({ children }: Props) {
  const pathname = usePathname();

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0.96, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0.96, y: -6 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="min-h-[100dvh]"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
