import { getAdminBearerToken } from "@/app/admin/dashboard/components/admin-dashboard-api";
import { authApi } from "@/lib/authApi";
import { getRestApiBase } from "@/lib/restApiBase";

const apiBase = () => getRestApiBase();

function authHeaders(): HeadersInit {
  const t = getAdminBearerToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/** Müştəri ödəniş sorğusu — JWT admin yox, `decor_current_user` sessiyasından gəlir */
function userAuthHeaders(): Record<string, string> {
  const u = authApi.getCurrentUser();
  const t = u?.token;
  if (!t || String(t).startsWith("mock.")) {
    throw new Error("Sessiya etibarsızdır (mock sessiya ilə server sorğusu dəstəklənmir).");
  }
  return { Authorization: `Bearer ${t}` };
}

export type ClientPaymentRequestRow = {
  id: number;
  userId: number;
  userFullName: string;
  username: string;
  amount: number;
  receiptImageData?: string;
  receiptFileName?: string;
  status: string;
  createdAt: string;
};

export type FinanceUserDebtRow = {
  userId: number;
  username: string;
  fullName: string;
  totalDebt: number;
};

export type FinanceTransactionType = "DEBIT" | "CREDIT";

export type FinanceTransactionHistoryRow = {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  transactionType: FinanceTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  performedBy?: string;
  note?: string;
  createdAt: string;
};

export type AdminCouponRow = {
  id: number;
  code: string;
  discountPercent: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount?: number;
  active: boolean;
  expiresAt?: string;
};

export async function submitClientPaymentRequest(
  amount: number,
  receiptImageData?: string,
  receiptFileName?: string
): Promise<ClientPaymentRequestRow> {
  const res = await fetch(`${apiBase()}/payment-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...userAuthHeaders(),
    },
    body: JSON.stringify({ amount, receiptImageData, receiptFileName }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || `Sorğu göndərilmədi (${res.status})`);
  }
  return res.json() as Promise<ClientPaymentRequestRow>;
}

export async function fetchMyClientPaymentRequests(): Promise<ClientPaymentRequestRow[]> {
  const res = await fetch(`${apiBase()}/payment-requests/my`, {
    headers: { ...userAuthHeaders() },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || "Ödəniş tarixçəsi alınmadı");
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export type InAppNotificationRow = {
  id: number;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
};

export async function fetchMyInAppNotifications(): Promise<InAppNotificationRow[]> {
  const res = await fetch(`${apiBase()}/notifications`, {
    headers: { ...userAuthHeaders() },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? (data as InAppNotificationRow[]) : [];
}

export async function fetchPendingClientPayments(): Promise<ClientPaymentRequestRow[]> {
  const res = await fetch(`${apiBase()}/admin/payments/pending`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function approveClientPaymentRequest(id: number): Promise<ClientPaymentRequestRow> {
  const res = await fetch(`${apiBase()}/admin/payments/${id}/approve`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || "Təsdiq alınmadı");
  }
  return res.json() as Promise<ClientPaymentRequestRow>;
}

export async function rejectClientPaymentRequest(id: number): Promise<ClientPaymentRequestRow> {
  const res = await fetch(`${apiBase()}/admin/payments/${id}/reject`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || "Rədd alınmadı");
  }
  return res.json() as Promise<ClientPaymentRequestRow>;
}

export async function markAllInAppNotificationsRead(): Promise<number> {
  const res = await fetch(`${apiBase()}/notifications/mark-all-as-read`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || "Əməliyyat alınmadı");
  }
  const data = (await res.json()) as { updated?: number };
  return data.updated ?? 0;
}

export async function fetchFinanceDebts(): Promise<FinanceUserDebtRow[]> {
  const res = await fetch(`${apiBase()}/admin/finance/debts`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? (data as FinanceUserDebtRow[]) : [];
}

export async function fetchFinanceTransactions(userId?: number): Promise<FinanceTransactionHistoryRow[]> {
  const url = userId
    ? `${apiBase()}/admin/finance/transactions?userId=${userId}`
    : `${apiBase()}/admin/finance/transactions`;
  const res = await fetch(url, { headers: { ...authHeaders() } });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? (data as FinanceTransactionHistoryRow[]) : [];
}

export async function updateFinanceBalance(input: {
  userId: number;
  amount: number;
  transactionType: FinanceTransactionType;
  note?: string;
}): Promise<FinanceTransactionHistoryRow> {
  const res = await fetch(`${apiBase()}/admin/finance/update-balance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || "Balans yenilənmədi");
  }
  return res.json() as Promise<FinanceTransactionHistoryRow>;
}

export async function createAdminCoupon(input: {
  code: string;
  discountPercent: number;
  minOrderAmount?: number;
  maxUses?: number;
  expiresAt?: string;
}): Promise<AdminCouponRow> {
  const res = await fetch(`${apiBase()}/admin/coupons`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || "Kupon yaradılmadı");
  }
  return res.json() as Promise<AdminCouponRow>;
}

export async function fetchAdminCoupons(): Promise<AdminCouponRow[]> {
  const res = await fetch(`${apiBase()}/admin/coupons`, { headers: { ...authHeaders() } });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data as AdminCouponRow[] : [];
}
