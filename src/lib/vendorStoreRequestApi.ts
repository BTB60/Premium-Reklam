import { authApi } from "@/lib/authApi";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "https://premium-reklam-backend.onrender.com/api";

export type VendorStoreApplicationDto = {
  id: number;
  userId: number;
  username?: string;
  userFullName?: string;
  clientReferenceId?: string | null;
  storeName: string;
  description: string;
  address: string;
  phone: string;
  email?: string | null;
  vendorDisplayName: string;
  vendorPhone?: string | null;
  categories: string[];
  status: string;
  rejectionReason?: string | null;
  processedBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  processedAt?: string | null;
};

function userHeaders(): Record<string, string> {
  const u = authApi.getCurrentUser();
  const t = u?.token;
  if (!t || String(t).startsWith("mock.")) {
    throw new Error("Mock sessiya — server müraciəti yoxdur");
  }
  return { Authorization: `Bearer ${t}` };
}

export async function submitVendorStoreApplication(input: {
  clientReferenceId?: string;
  storeName: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  vendorDisplayName: string;
  vendorPhone: string;
  categories: string[];
}): Promise<VendorStoreApplicationDto> {
  const res = await fetch(`${BASE_URL}/vendor/store-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...userHeaders() },
    body: JSON.stringify({
      clientReferenceId: input.clientReferenceId,
      storeName: input.storeName,
      description: input.description,
      address: input.address,
      phone: input.phone,
      email: input.email || null,
      vendorDisplayName: input.vendorDisplayName,
      vendorPhone: input.vendorPhone || null,
      categories: input.categories,
    }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || `Müraciət göndərilmədi (${res.status})`);
  }
  return res.json() as Promise<VendorStoreApplicationDto>;
}

export async function fetchMyVendorStoreApplications(): Promise<VendorStoreApplicationDto[]> {
  const res = await fetch(`${BASE_URL}/vendor/store-requests/mine`, {
    headers: { ...userHeaders() },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchAdminVendorStoreApplications(token: string): Promise<VendorStoreApplicationDto[]> {
  const res = await fetch(`${BASE_URL}/admin/store-requests`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`admin/store-requests ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function approveVendorStoreApplication(token: string, id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/admin/store-requests/${id}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || "Təsdiq alınmadı");
  }
}

export async function rejectVendorStoreApplication(
  token: string,
  id: number,
  reason?: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/admin/store-requests/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reason: reason || null }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || "Rədd alınmadı");
  }
}
