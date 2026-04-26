"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardOrdersNewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/orders/new");
  }, [router]);
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#6B7280]">
      Yönləndirilir…
    </div>
  );
}
