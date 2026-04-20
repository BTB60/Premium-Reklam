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
