import { storeRequests } from "@/lib/db";
import { orders } from "@/lib/db/orders";
import type { Order } from "@/lib/db/types";

/** Admin paneldə yalnız mock/local DB üçün gözləyən hadisələr (mağaza müraciəti + təsdiq gözləyən sifariş). */
export type AdminMockPendingBreakdown = {
  storeRequests: number;
  newOrdersPendingApproval: number;
};

export function getAdminMockPendingBreakdown(): AdminMockPendingBreakdown {
  try {
    const storeRequestsCount = storeRequests.getPending()?.length ?? 0;
    const allOrders = orders.getAll() || [];
    const newOrdersPendingApproval = allOrders.filter(
      (o: Order) => o.workflowStatus === "təsdiq"
    ).length;
    return { storeRequests: storeRequestsCount, newOrdersPendingApproval };
  } catch {
    return { storeRequests: 0, newOrdersPendingApproval: 0 };
  }
}

export function getAdminMockPendingActivityTotal(): number {
  const b = getAdminMockPendingBreakdown();
  return b.storeRequests + b.newOrdersPendingApproval;
}
