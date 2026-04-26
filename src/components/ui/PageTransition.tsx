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
    <div className="relative isolate min-h-[100dvh] w-full max-w-[100vw] overflow-x-clip">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={pathname}
          layout={false}
          initial={{ opacity: 0.96, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0.98, y: -4 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="min-h-[100dvh] w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
