// API Base URL - MUST be set in Vercel Environment Variables
// For Vercel: NEXT_PUBLIC_API_URL = https://premium-reklam-backend.onrender.com
// Local dev: Next rewrites /api-proxy → backend (CORS-sız); NEXT_PUBLIC_API_DIRECT=1 ilə birbaşa URL.

import { getRestApiBase, getBackendOrigin } from "./restApiBase";

declare const process: {
  env: Record<string, string | undefined>;
};

const API_URL_FROM_ENV = process.env.NEXT_PUBLIC_API_URL || "(not set)";
const baseUrl = () => getRestApiBase();
const healthUrl = () => `${baseUrl()}/health`;
const MOCK_AUTH_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === "true" ||
  (!process.env.NEXT_PUBLIC_API_URL && process.env.NODE_ENV !== "production");

type MockAuthModule = typeof import("@/lib/db/auth");
let cachedMockAuth: MockAuthModule["auth"] | null = null;

async function getMockAuth() {
  if (!MOCK_AUTH_ENABLED) return null;
  if (cachedMockAuth) return cachedMockAuth;
  const mod = await import("@/lib/db/auth");
  cachedMockAuth = mod.auth;
  return cachedMockAuth;
}

if (process.env.NODE_ENV === "development") {
  console.log("[API Config] NEXT_PUBLIC_API_URL:", API_URL_FROM_ENV);
  console.log("[API Config] REST base (this request context):", baseUrl());
  console.log("[API Config] Backend origin:", getBackendOrigin());
}

/** BOM, boş cavab, gateway düz mətni və ya `{...}` daxilində JSON üçün. */
function parseJsonObjectResponse(raw: string): Record<string, unknown> | null {
  const stripped = raw.replace(/^\uFEFF/, "").trim();
  if (!stripped) return null;
  try {
    const val = JSON.parse(stripped) as unknown;
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      return val as Record<string, unknown>;
    }
    return null;
  } catch {
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        const val = JSON.parse(stripped.slice(start, end + 1)) as unknown;
        if (val !== null && typeof val === "object" && !Array.isArray(val)) {
          return val as Record<string, unknown>;
        }
      } catch {
        /* ignore */
      }
    }
    return null;
  }
}

// Map backend role to frontend role
function mapRole(role: string): string {
  const roleMap: Record<string, string> = {
    'ADMIN': 'ADMIN',
    'DECORCU': 'DECORATOR',
    'DECORATOR': 'DECORATOR',
    'VENDOR': 'VENDOR',
    'SUBADMIN': 'SUBADMIN',
  };
  return roleMap[role] || role;
}

// Map frontend status to backend status (lowercase for backend enum)
function mapStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'approved': 'approved',
    'confirmed': 'confirmed',
    'design': 'design',
    'production': 'production',
    'printing': 'printing',
    'ready': 'ready',
    'delivering': 'delivering',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'PENDING': 'pending',
    'APPROVED': 'approved',
    'CONFIRMED': 'confirmed',
    'DESIGN': 'design',
    'IN_PROGRESS': 'production',
    'PRINTING': 'printing',
    'READY': 'ready',
    'DELIVERING': 'delivering',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled',
    'gözləyir': 'pending',
    'tesdiqləndi': 'approved',
    'təsdiqləndi': 'confirmed',
    'dizayn': 'design',
    'çap': 'printing',
    'cap': 'printing',
    'istehsalat': 'production',
    'istehsal': 'production',
    'hazirlanir': 'production',
    'hazir': 'ready',
    'hazır': 'ready',
    'çatdırılma': 'delivering',
    'catdirilma': 'delivering',
    'tamamlandı': 'completed',
    'tamamlandi': 'completed',
    'ləğv edildi': 'cancelled',
    'legv edildi': 'cancelled',
  };
  return statusMap[status] || status.toLowerCase();
}

export interface UserData {
  token: string;
  userId: string | number;
  username: string;
  fullName: string;
  role: string;
  email?: string;
  phone?: string;
  /** Subadmin JWT cavabında ola bilər */
  permissions?: Record<string, string>;
}

export interface AuthApi {
  register(userData: any): Promise<any>;
  login(username: string, password: string): Promise<UserData>;
  getAllUsers(): Promise<any[]>;
  getCurrentUser(): UserData | null;
  saveCurrentUser(user: UserData): void;
  logout(): void;
  forgotPassword(email: string): Promise<any>;
  resetPassword(token: string, newPassword: string): Promise<any>;
  getOrdersFromBackend(filters?: any): Promise<any>;
  getMyOrders(): Promise<any>;
  getMySummary(): Promise<any>;
  getById(id: number): Promise<any>;
  create(orderData: any): Promise<any>;
  updateOrderStatus(orderId: string, status: string): Promise<any>;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  description: string;
  unit: string;
  /** Yalnız admin API cavabında ola bilər; istifadəçi kataloqunda göndərilmir. */
  purchasePrice?: number;
  salePrice: number;
  stockQuantity: number;
  minStockLevel: number;
  width?: number;
  height?: number;
  status: string;
}

export interface Order {
  id: string | number;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerWhatsapp?: string;
  customerAddress?: string;
  userId?: number;
  userFullName?: string;
  userUsername?: string;
  status: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';
  paymentMethod: string;
  isCredit: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  productId?: number;
  productName: string;
  unit: string;
  quantity: number;
  width?: number;
  height?: number;
  area: number;
  unitPrice: number;
  lineTotal: number;
  note?: string;
}

export interface UserPrice {
  id: number;
  userId: number;
  productId: number;
  customPrice: number;
  discountPercent: number;
  isActive: boolean;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const user = getCurrentUser();
  if (user?.token) return user.token;
  try {
    const raw = sessionStorage.getItem("premium_subadmin_jwt");
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      const s = JSON.parse(trimmed) as { token?: string };
      if (s?.token) return s.token;
    } catch {
      // Backward compatibility: older sessions may store plain JWT string.
    }
    if (trimmed.includes(".") && !trimmed.startsWith("{")) return trimmed;
  } catch {
    /* ignore */
  }
  return null;
}

function getCurrentUser(): UserData | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("decor_current_user");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    // Минимальная валидация
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.token || !parsed.role || !parsed.userId) return null;
    return parsed;
  } catch (e) {
    // Битый JSON — очищаем и возвращаем null
    console.warn("[Auth] Corrupted user session, clearing");
    localStorage.removeItem("decor_current_user");
    return null;
  }
}

async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(healthUrl(), { method: "GET" });
    if (!res.ok) return false;
    const data = (await res.json().catch(() => ({}))) as { status?: string };
    return String(data.status || "").toUpperCase() === "UP";
  } catch {
    return false;
  }
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${baseUrl()}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = res.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!res.ok) {
      let errorMessage = "Xəta baş verdi";
      if (isJson) {
        try {
          const error = await res.json();
          errorMessage = error.message || error.error || error.title || `Xəta (${res.status})`;
        } catch {
          errorMessage = `Server xətası (${res.status}): ${res.statusText}`;
        }
      } else {
        const text = await res.text();
        console.error("Non-JSON error response:", text);
        errorMessage = `Server xətası (${res.status}): ${res.statusText}`;
      }
      throw new Error(errorMessage);
    }

    if (isJson) {
      return res.json();
    } else {
      try {
        const text = await res.text();
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
          return JSON.parse(text);
        }
        console.warn("Non-JSON response:", text.substring(0, 200));
        return {};
      } catch {
        return {};
      }
    }
  } catch (error: any) {
    if (error.message === "Failed to fetch" || error.message.includes("fetch") || error.message.includes("NetworkError")) {
      const isHealthy = await checkBackendHealth();
      if (isHealthy) {
        throw new Error("Server işləyir, amma şəbəkə/CORS səbəbindən sorğu alınmadı.");
      }
      throw new Error(`Server bağlantısı yoxdur. Backend işləyirmi? ${healthUrl()} ünvanını yoxlayın.`);
    }
    throw error;
  }
}

export const authApi = {
  async register(userData: any) {
    const res = await fetch(`${baseUrl()}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || "Xəta baş verdi");
    return {
      ...data,
      userId: data.userId ?? data.id,
      role: mapRole(data.role),
    };
  },

  async login(username: string, password: string): Promise<UserData> {
    const tryLocalMock = async (): Promise<UserData | null> => {
      if (!MOCK_AUTH_ENABLED) return null;
      const mockAuth = await getMockAuth();
      if (!mockAuth) return null;
      if (typeof window === "undefined") return null;
      const result = await mockAuth.login(username, password);
      if (!result.success || !result.user) return null;
      const { password: _pw, ...safe } = result.user;
      return {
        token: `mock.${String(safe.id)}.${Date.now()}`,
        userId: safe.id,
        username: safe.username,
        fullName: safe.fullName,
        email: safe.email,
        phone: safe.phone,
        role: mapRole(safe.role),
      };
    };

    try {
      const res = await fetch(`${baseUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const text = await res.text();

      if (text.trim().startsWith("<")) {
        const mockUser = await tryLocalMock();
        if (mockUser) {
          console.warn("[authApi] Backend cavabı HTML; lokal mock sessiya istifadə olunur");
          return mockUser;
        }
        throw new Error("Server bağlantısı yoxdur. Backend xidmətini işə salın.");
      }

      const data = parseJsonObjectResponse(text);
      if (!data) {
        const mockUser = await tryLocalMock();
        if (mockUser) return mockUser;
        if (process.env.NODE_ENV === "development") {
          console.warn("[authApi] login: JSON parse uğursuz", {
            status: res.status,
            preview: text.replace(/^\uFEFF/, "").trim().slice(0, 240),
          });
        }
        const empty = !text.replace(/^\uFEFF/, "").trim();
        throw new Error(
          empty
            ? `Boş cavab (HTTP ${res.status}). Backend/proxy işləmir və ya sorğu vaxtı bitib.`
            : `Cavab düzgün JSON deyil (HTTP ${res.status}). Çox vaxt Render yuxarı olanda və ya proxy xətası — bir neçə saniyə sonra yenidən cəhd edin.`
        );
      }

      if (res.ok) {
        const token = typeof data.token === "string" ? data.token : "";
        const userId = (data.userId ?? data.id) as string | number;
        const roleRaw = typeof data.role === "string" ? data.role : "";
        return {
          ...data,
          token,
          userId,
          username: String(data.username ?? ""),
          fullName: String(data.fullName ?? ""),
          role: mapRole(roleRaw),
        } as UserData;
      }

      const mockUser = await tryLocalMock();
      if (mockUser) {
        console.warn("[authApi] Backend girişi rədd etdi; lokal yoxlama uyğun gəldi");
        return mockUser;
      }

      throw new Error(
        String(data.message || data.error || "Giriş uğursuz oldu")
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (
        msg.includes("Server bağlantısı") ||
        msg.includes("fetch") ||
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError")
      ) {
        const mockUser = await tryLocalMock();
        if (mockUser) {
          console.warn("[authApi] Şəbəkə xətası; lokal mock sessiya istifadə olunur");
          return mockUser;
        }
        const isHealthy = await checkBackendHealth();
        if (isHealthy) {
          throw new Error("Server UP-dır, amma giriş sorğusu şəbəkə/CORS səbəbi ilə alınmadı.");
        }
        throw new Error(
          "Server bağlantısı yoxdur. Backend işləyirmi? " + healthUrl() + " ünvanını yoxlayın."
        );
      }
      throw new Error(msg || "Giriş uğursuz oldu");
    }
  },

  async getAllUsers(): Promise<any[]> {
    try {
      const token = getToken();
      
      let response = await fetch(`${baseUrl()}/admin/users`, {
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
      });

      if (response.status === 404) {
        response = await fetch(`${baseUrl()}/users`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
        });
      }
      
      if (!response.ok) {
        console.warn("[API] getAllUsers error:", response.status);
        return [];
      }
      
      const text = await response.text();
      
      if (!text || text.trim() === "") {
        return [];
      }
      
      if (text.trim().startsWith("<")) {
        console.error("[API] Received HTML instead of JSON");
        return [];
      }
      
      const data = JSON.parse(text);
      
      const users = Array.isArray(data) ? data : (data.users || data.content || []);
      
      if (!Array.isArray(users)) {
        console.error("[API] Unexpected data format:", typeof users);
        return [];
      }
      
      return users.map((u: any) => ({
        ...u,
        role: mapRole(u.role),
        fullName: u.fullName || u.full_name || u.username,
        id: u.id || u.userId,
      }));
    } catch (error: any) {
      console.error("[API] getAllUsers error:", error?.message || error);
      return [];
    }
  },

  async deleteUser(userId: string | number): Promise<void> {
    await fetchApi(`/users/${userId}`, { method: "DELETE" });
  },

  async changeMyPassword(currentPassword: string, newPassword: string): Promise<void> {
    await fetchApi(`/users/profile/me/password`, {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  getCurrentUser,

  saveCurrentUser(user: UserData) {
    if (typeof window !== "undefined") {
      localStorage.setItem("decor_current_user", JSON.stringify(user));
    }
  },

  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("decor_current_user");
    }
  },

  async forgotPassword(email: string) {
    const res = await fetch(`${baseUrl()}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || "Xəta baş verdi");
    return data;
  },

  async resetPassword(token: string, newPassword: string) {
    const res = await fetch(`${baseUrl()}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || "Xəta baş verdi");
    return data;
  },

  async getMyProfile(): Promise<{
    userId: string;
    username: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    totalDebt?: number;
  }> {
    const data = await fetchApi("/users/profile/me");
    return {
      ...data,
      role: mapRole(String(data.role)),
      totalDebt: Number((data as { totalDebt?: unknown }).totalDebt ?? 0),
    };
  },

  async updateMyProfile(profile: {
    fullName?: string;
    phone?: string;
    email?: string;
  }): Promise<{
    userId: string;
    username: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    totalDebt?: number;
  }> {
    const data = await fetchApi("/users/profile/me", {
      method: "PUT",
      body: JSON.stringify(profile),
    });
    return {
      ...data,
      role: mapRole(String(data.role)),
      totalDebt: Number((data as { totalDebt?: unknown }).totalDebt ?? 0),
    };
  },
};

export const productApi = {
  async getAll(): Promise<Product[]> {
    try {
      const user = getCurrentUser();
      const token = user?.token;
      
      const response = await fetch(`${baseUrl()}/products`, {
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
      });
      
      const text = await response.text();
      
      if (text.trim().startsWith("<")) {
        console.error("[API] Products API returned HTML:", text.substring(0, 200));
        return [];
      }
      
      const data = JSON.parse(text);
      
      const products = Array.isArray(data) ? data : (data.products || data.content || []);
      return products;
    } catch (error: any) {
      console.error("[API] productApi.getAll error:", error?.message || error);
      return [];
    }
  },

  async getById(id: number): Promise<Product | null> {
    try {
      const user = getCurrentUser();
      const token = user?.token;
      
      const response = await fetch(`${baseUrl()}/products/${id}`, {
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
      });
      
      if (!response.ok) return null;
      
      const text = await response.text();
      if (text.trim().startsWith("<")) return null;
      
      return JSON.parse(text);
    } catch {
      return null;
    }
  },

  async getCategories(): Promise<string[]> {
    try {
      const user = getCurrentUser();
      const token = user?.token;
      
      const response = await fetch(`${baseUrl()}/products/categories`, {
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
      });
      
      if (!response.ok) return [];
      
      const text = await response.text();
      if (text.trim().startsWith("<")) return [];
      
      const data = JSON.parse(text);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async create(product: Partial<Product>): Promise<Product> {
    return fetchApi("/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
  },

  async update(id: number, product: Partial<Product>): Promise<Product> {
    return fetchApi(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    });
  },

  async delete(id: number): Promise<void> {
    return fetchApi(`/products/${id}`, {
      method: "DELETE",
    });
  },

  async getUserPrice(userId: number, productId: number): Promise<number> {
    return fetchApi(`/products/user-prices/${userId}/product/${productId}`);
  },

  async setUserPrice(userId: number, productId: number, customPrice: number, discountPercent?: number): Promise<UserPrice> {
    return fetchApi("/products/user-prices", {
      method: "POST",
      body: JSON.stringify({
        userId,
        productId,
        customPrice,
        discountPercent: discountPercent || 0,
      }),
    });
  },

  async getUserPrices(userId: number): Promise<UserPrice[]> {
    return fetchApi(`/products/user-prices/${userId}`);
  },

  async deleteUserPrice(userId: number, productId: number): Promise<void> {
    return fetchApi(`/products/user-prices/${userId}/product/${productId}`, {
      method: "DELETE",
    });
  },

  /** Yalnız backend DB-dəki aktiv məhsullar (admin/subadmin əlavə etdiyi kataloq). */
  async getActiveCatalog(): Promise<Product[]> {
    const all = await this.getAll();
    return all.filter((p) => String(p.status ?? "").toUpperCase() === "ACTIVE");
  },
};

export interface OrderSummary {
  todayOrderCount: number;
  todayOrderAmount: number;
  monthOrderCount: number;
  monthOrderAmount: number;
  totalPaid: number;
  totalDebt: number;
  totalOrders: number;
  totalAmount: number;
}

function normalizeOrder(order: any): Order {
  return {
    ...order,
    id: order.id,
    orderNumber: order.orderNumber ?? order.order_number ?? "",
    customerName: order.customerName ?? order.customer_name ?? "",
    customerPhone: order.customerPhone ?? order.customer_phone ?? "",
    customerWhatsapp: order.customerWhatsapp ?? order.customer_whatsapp ?? "",
    customerAddress: order.customerAddress ?? order.customer_address ?? "",
    userId: order.userId ?? order.user_id,
    userFullName: order.userFullName ?? order.user_full_name ?? order.user_name,
    userUsername: order.userUsername ?? order.user_username,
    status: order.status ?? "pending",
    subtotal: Number(order.subtotal ?? order.sub_total ?? 0),
    discountPercent: Number(order.discountPercent ?? order.discount_percent ?? 0),
    discountAmount: Number(order.discountAmount ?? order.discount_amount ?? 0),
    totalAmount: Number(order.totalAmount ?? order.total_amount ?? 0),
    paidAmount: Number(order.paidAmount ?? order.paid_amount ?? 0),
    remainingAmount: Number(order.remainingAmount ?? order.remaining_amount ?? 0),
    paymentStatus: order.paymentStatus ?? order.payment_status ?? "PENDING",
    paymentMethod: order.paymentMethod ?? order.payment_method ?? "CASH",
    isCredit: Boolean(order.isCredit ?? order.is_credit ?? false),
    note: order.note ?? "",
    createdAt: order.createdAt ?? order.created_at ?? new Date().toISOString(),
    updatedAt: order.updatedAt ?? order.updated_at ?? new Date().toISOString(),
    items: Array.isArray(order.items)
      ? order.items.map((item: any) => ({
          ...item,
          id: item.id,
          productId: item.productId ?? item.product_id,
          productName: item.productName ?? item.product_name ?? "",
          unit: item.unit ?? "M2",
          quantity: Number(item.quantity ?? 0),
          width: item.width != null ? Number(item.width) : undefined,
          height: item.height != null ? Number(item.height) : undefined,
          area: Number(item.area ?? 0),
          unitPrice: Number(item.unitPrice ?? item.unit_price ?? 0),
          lineTotal: Number(item.lineTotal ?? item.line_total ?? 0),
          note: item.note ?? "",
        }))
      : [],
  };
}

export const orderApi = {
  async getAll(filters?: { userId?: string; status?: string; paymentStatus?: string; dateFrom?: string; dateTo?: string }): Promise<{ orders: Order[]; summary?: OrderSummary; total: number }> {
    const params = new URLSearchParams();
    if (filters?.userId) params.set('userId', filters.userId);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.paymentStatus) params.set('paymentStatus', filters.paymentStatus);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    
    const queryString = params.toString();
    return fetchApi(`/orders${queryString ? '?' + queryString : ''}`);
  },

  async getMyOrders(): Promise<{ orders: Order[]; summary?: OrderSummary; total: number }> {
    const user = getCurrentUser();
    if (!user) return { orders: [], summary: undefined, total: 0 };
    try {
      const data = await fetchApi(`/orders/my`);
      const rows = Array.isArray(data) ? data : (data?.orders || data?.content || []);
      const orders = Array.isArray(rows) ? rows.map(normalizeOrder) : [];
      return { orders, total: orders.length };
    } catch (error: any) {
      const message = String(error?.message || "");

      // Backend fallback for Hibernate LazyInitializationException on /orders/my
      if (
        message.includes("could not initialize proxy") ||
        message.includes("no Session")
      ) {
        try {
          const fallback = await fetchApi(`/orders?userId=${encodeURIComponent(String(user.userId))}`);
          const rows = Array.isArray(fallback) ? fallback : (fallback?.orders || fallback?.content || []);
          const orders = Array.isArray(rows) ? rows.map(normalizeOrder) : [];
          return { orders, total: orders.length };
        } catch (fallbackError: any) {
          console.error("[API] getMyOrders fallback error:", fallbackError?.message || fallbackError);
          return { orders: [], summary: undefined, total: 0 };
        }
      }

      console.error("[API] getMyOrders error:", message);
      return { orders: [], summary: undefined, total: 0 };
    }
  },

  async getMySummary(): Promise<OrderSummary> {
    const user = getCurrentUser();
    if (!user) {
      return {
        todayOrderCount: 0,
        todayOrderAmount: 0,
        monthOrderCount: 0,
        monthOrderAmount: 0,
        totalPaid: 0,
        totalDebt: 0,
        totalOrders: 0,
        totalAmount: 0,
      };
    }
    
    const orders = await this.getMyOrders();
    const orderList = orders.orders || [];
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const monthStart = today.substring(0, 7) + '-01';
    
    let todayCount = 0, todayAmount = 0;
    let monthCount = 0, monthAmount = 0;
    let totalAmount = 0, totalPaid = 0, totalDebt = 0;
    
    orderList.forEach((order: any) => {
      const orderDate = (order.createdAt || '').split('T')[0];
      const amount = Number(order.totalAmount) || 0;
      const paid = Number(order.paidAmount) || 0;
      
      totalAmount += amount;
      totalPaid += paid;
      totalDebt += (amount - paid);
      
      if (orderDate === today) {
        todayCount++;
        todayAmount += amount;
      }
      if (orderDate >= monthStart) {
        monthCount++;
        monthAmount += amount;
      }
    });
    
    return {
      todayOrderCount: todayCount,
      todayOrderAmount: todayAmount,
      monthOrderCount: monthCount,
      monthOrderAmount: monthAmount,
      totalPaid,
      totalDebt,
      totalOrders: orderList.length,
      totalAmount,
    };
  },

  async getById(id: string | number): Promise<Order> {
    const data = await fetchApi(`/orders/${id}`);
    return normalizeOrder(data);
  },

  async create(orderData: any): Promise<Order> {
    const user = getCurrentUser();
    const data = await fetchApi("/orders", {
      method: "POST",
      body: JSON.stringify({
        ...orderData,
        userId: user?.userId || orderData.userId,
      }),
    });
    return normalizeOrder(data.order || data);
  },

  async updateStatus(id: string | number, status: string): Promise<Order> {
    const data = await fetchApi(`/orders/${id}/status?status=${encodeURIComponent(mapStatus(status))}`, {
      method: "PUT",
    });
    return normalizeOrder(data.order || data);
  },

  async updatePayment(id: string | number, paidAmount: number, paymentMethod?: string, note?: string): Promise<Order> {
    const currentOrder = await this.getById(id);
    const currentPaid = Number(currentOrder?.paidAmount || 0);
    const targetPaid = Number(paidAmount || 0);
    const delta = targetPaid - currentPaid;
    if (delta <= 0) {
      throw new Error("Mövcud backend yalnız əlavə ödənişi dəstəkləyir.");
    }
    return this.adminPayment(id, delta, paymentMethod, note);
  },

  async addPayment(id: string | number, amount: number, paymentMethod?: string, note?: string): Promise<Order> {
    return this.adminPayment(id, amount, paymentMethod, note);
  },

  async delete(id: string | number): Promise<void> {
    return fetchApi(`/orders/${id}`, {
      method: "DELETE",
    });
  },

  async adminPayment(orderId: string | number, amount: number, paymentMethod?: string, note?: string): Promise<any> {
    const payload: Record<string, any> = { amount };
    if (paymentMethod) payload.paymentMethod = paymentMethod;
    if (note) payload.note = note;
    const data = await fetchApi(`/payments/order/${orderId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return normalizeOrder(data.order || data);
  },

  async getOrdersFromBackend(filters?: { userId?: string; status?: string; paymentStatus?: string; dateFrom?: string; dateTo?: string }): Promise<{ orders: any[]; total: number }> {
    try {
      const user = getCurrentUser();
      const token = user?.token;
      
      const params = new URLSearchParams();
      if (filters?.userId) params.set('userId', filters.userId);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.paymentStatus) params.set('paymentStatus', filters.paymentStatus);
      if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.set('dateTo', filters.dateTo);
      
      const queryString = params.toString();
      const url = `/orders${queryString ? '?' + queryString : ''}`;
      
      const response = await fetch(`${baseUrl()}${url}`, {
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
      });
      
      if (!response.ok) {
        console.warn("[API] getOrdersFromBackend error:", response.status);
        return { orders: [], total: 0 };
      }
      
      const text = await response.text();
      
      if (!text || text.trim() === "" || text.trim().startsWith("<")) {
        return { orders: [], total: 0 };
      }
      
      const data = JSON.parse(text);
      
      const orders = Array.isArray(data) ? data : (data.orders || data.content || []);
      
      if (!Array.isArray(orders)) {
        console.error("[API] Unexpected orders format:", orders);
        return { orders: [], total: 0 };
      }
      
      return { orders: orders.map(normalizeOrder), total: orders.length };
    } catch (error: any) {
      console.error("[API] getOrdersFromBackend error:", error?.message || error);
      return { orders: [], total: 0 };
    }
  },
};

export { announcementApi, type Announcement } from "./authApi/announcements";

export default authApi;