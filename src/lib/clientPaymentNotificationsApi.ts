import { getAdminBearerToken } from "@/app/admin/dashboard/components/admin-dashboard-api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "https://premium-reklam-backend.onrender.com/api";

function authHeaders(): HeadersInit {
  const t = getAdminBearerToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export type ClientPaymentRequestRow = {
  id: number;
  userId: number;
  userFullName: string;
  username: string;
  amount: number;
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

export async function submitClientPaymentRequest(amount: number): Promise<ClientPaymentRequestRow> {
  const res = await fetch(`${BASE_URL}/payment-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || "Sorğu göndərilmədi");
  }
  return res.json() as Promise<ClientPaymentRequestRow>;
}

export async function fetchPendingClientPayments(): Promise<ClientPaymentRequestRow[]> {
  const res = await fetch(`${BASE_URL}/admin/payments/pending`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function approveClientPaymentRequest(id: number): Promise<ClientPaymentRequestRow> {
  const res = await fetch(`${BASE_URL}/admin/payments/${id}/approve`, {
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
  const res = await fetch(`${BASE_URL}/admin/payments/${id}/reject`, {
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
  const res = await fetch(`${BASE_URL}/notifications/mark-all-as-read`, {
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
  const res = await fetch(`${BASE_URL}/admin/finance/debts`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? (data as FinanceUserDebtRow[]) : [];
}

export async function fetchFinanceTransactions(userId?: number): Promise<FinanceTransactionHistoryRow[]> {
  const url = userId
    ? `${BASE_URL}/admin/finance/transactions?userId=${userId}`
    : `${BASE_URL}/admin/finance/transactions`;
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
  const res = await fetch(`${BASE_URL}/admin/finance/update-balance`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || "Balans yenilənmədi");
  }
  return res.json() as Promise<FinanceTransactionHistoryRow>;
}
