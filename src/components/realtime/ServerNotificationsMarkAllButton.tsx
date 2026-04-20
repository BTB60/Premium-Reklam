"use client";

import { useCallback, useState } from "react";
import { markAllInAppNotificationsRead } from "@/lib/clientPaymentNotificationsApi";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function ServerNotificationsMarkAllButton({ className }: Props) {
  const [busy, setBusy] = useState(false);

  const onClick = useCallback(async () => {
    setBusy(true);
    try {
      await markAllInAppNotificationsRead();
      window.dispatchEvent(new CustomEvent("premium:inapp-dismiss-all"));
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={cn(
        "text-xs font-medium text-[#ff6600] hover:underline disabled:opacity-50 whitespace-nowrap",
        className
      )}
    >
      {busy ? "…" : "Hamısını oxu"}
    </button>
  );
}
