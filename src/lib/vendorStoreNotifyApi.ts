import { authApi } from "@/lib/authApi";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "https://premium-reklam-backend.onrender.com/api";

/** Real JWT ilə giriş edən satıcı mağaza müraciəti göndərəndə admin/subadmin WebSocket + admin in-app bildirişi */
export async function notifyVendorStoreRequestSubmitted(params: {
  requestId: string;
  storeName: string;
}): Promise<void> {
  const user = authApi.getCurrentUser();
  const token = user?.token;
  if (!token || String(token).startsWith("mock.")) return;

  try {
    const res = await fetch(`${BASE_URL}/vendor/store-requests/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        requestId: params.requestId,
        storeName: params.storeName,
      }),
    });
    if (!res.ok && process.env.NODE_ENV === "development") {
      console.warn("[vendorStoreNotify] HTTP", res.status);
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[vendorStoreNotify]", e);
  }
}
